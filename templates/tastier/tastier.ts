import { RenderFunction, VirtualFile } from '@acrontum/filesystem-template';
import { promises } from 'fs';
import { basename, join } from 'path';
import * as ts from 'typescript';

type NodeInfo = {
  node: ts.Node;
  text: string;
  name: string;
  visibility: string;
  imports: Record<string, string[]>;
  returnValue: string;
  implemented?: boolean;
};
type NodeInfoMap = Record<string, NodeInfo>;

const getChildNodes = (sourceFile: ts.SourceFile, node: ts.Node, kinds?: ts.SyntaxKind[]): ts.Node[] => {
  const nodes: ts.Node[] = [node];
  const result: ts.Node[] = [];
  const kindMap = new Map(kinds?.map((k) => [k, true]));

  while (nodes.length > 0) {
    const node = nodes.shift();

    if (!node) {
      continue;
    }

    if (!kinds || kindMap.has(node.kind)) {
      result.push(node);
    }

    if (node.getChildCount(sourceFile) >= 0) {
      nodes.unshift(...node.getChildren());
    }
  }

  return result;
};

const getSourceNodes = (sourceFile: ts.SourceFile, kinds?: ts.SyntaxKind[]): ts.Node[] => {
  const nodes: ts.Node[] = [sourceFile];
  const result: ts.Node[] = [];
  const kindMap = new Map(kinds?.map((k) => [k, true]));

  while (nodes.length > 0) {
    const node = nodes.shift();

    if (!node) {
      continue;
    }

    if (!kinds || kindMap.has(node.kind)) {
      result.push(node);
    }

    if (node.getChildCount(sourceFile) >= 0) {
      nodes.unshift(...node.getChildren());
    }
  }

  return result;
};

const getNodesOfType = (file: ts.SourceFile, kinds: ts.SyntaxKind[], log = false): NodeInfoMap => {
  const nodes = getSourceNodes(file, kinds);
  const kindMap = new Map(kinds?.map((k) => [k, true]));
  const nameToText: NodeInfoMap = {};

  const allImports = getFileImports(file).imports;
  const importsByName = Object.entries(allImports).reduce((acc: Record<string, string>, [file, imports]) => {
    imports.forEach((i) => (acc[i] = file));

    return acc;
  }, {});

  for (const node of nodes) {
    let text = '';
    let name = '';
    let visibility = 'public';
    let returnValue = '';

    node.getChildren(file).forEach((child) => {
      if (child.kind === ts.SyntaxKind.JSDoc) {
        return;
      }
      text += child.getFullText(file);

      if (!returnValue && child.kind === ts.SyntaxKind.TypeReference) {
        returnValue = child.getFullText(file).trim();
      }

      if (child.kind === ts.SyntaxKind.SyntaxList) {
        const mods = child
          .getText(file)
          .split(' ')
          .reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>);

        if (mods.private) {
          visibility = 'private';
        } else if (mods.protected) {
          visibility = 'protected';
        }
      }
      if (!name && child.kind === ts.SyntaxKind.Identifier) {
        name = child.getText(file);
      } else if (!name && kindMap.has(ts.SyntaxKind.ImportDeclaration) && child.kind === ts.SyntaxKind.StringLiteral) {
        name = child.getText(file).replace(/['"]/g, '');
      }
    });

    const imports: Record<string, string[]> = {};
    for (const ref of getChildNodes(file, node, [ts.SyntaxKind.TypeReference])) {
      const text = ref.getFullText(file).trim();
      if (!/^Promise/.test(text)) {
        mergeImports(imports, { [importsByName[text]]: [text] });
      }
    }

    nameToText[name] = { node, text, name, visibility, imports, returnValue };
  }

  return nameToText;
};

const getServiceMethod = (name: string) => {
  const parsed = name.match(/(?<resource>[A-Z]?[a-z]+)(?<id>Id)?(?<method>Get|Post|Delete|Patch)$/);
  if (!parsed) {
    return name;
  }
  const { resource, id, method } = parsed.groups as Record<string, string>;
  const action = {
    Get: 'list',
    IdGet: 'get',
    Post: 'create',
    IdDelete: 'delete',
    IdPatch: 'update',
    Put: 'upsert',
    IdPut: 'upsert',
  }[`${id || ''}${method}`];

  return `${action}${resource.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}`;
};

const getServiceClassName = (domain: string) => domain.replace('DomainInterface.ts', 'Service');

const getServiceFileName = (serviceClassName: string) =>
  serviceClassName
    .replace(/(?:([a-z])([A-Z]))|(?:((?!^)[A-Z])([a-z]))/g, '$1-$3$2$4')
    .toLowerCase()
    .replace('-service', '.service.ts');

const addImplementation = (interfaceFile: ts.SourceFile, domainMethod: NodeInfo, name: string /*, importService: boolean = false*/) => {
  const serviceClassName = getServiceClassName(basename(interfaceFile.fileName));
  const serviceFileName = getServiceFileName(serviceClassName).replace(/\.ts$/, '');
  const serviceMethodName = getServiceMethod(name);

  let domainImplementation = '';
  let serviceMethod = '';

  if (!domainMethod.implemented) {
    domainImplementation = domainMethod.node.getFullText(interfaceFile).replace(
      /;$/,
      ` {
    return ${serviceClassName}.${serviceMethodName}();
  }`
    );

    serviceMethod = `
  static ${serviceMethodName}(): ${domainMethod?.returnValue || 'any'} {
    throw new NotImplementedException();
  }`;
  }

  const domain = mergeImports({}, domainMethod?.imports, !domainMethod.implemented ? { [`@/services/${serviceFileName}`]: [serviceClassName] } : {});
  const service = mergeImports({}, domainMethod?.imports, { '@/http/nodegen/errors': ['NotImplementedException'] });
  const imports = { domain, service };

  const serviceClass = `export class ${serviceClassName} {`;

  return { domainImplementation, imports, serviceMethod, serviceClass, serviceMethodName };
};

const mergeImports = (a: Record<string, string[]> = {}, ...sources: Record<string, string[]>[]): Record<string, string[]> => {
  for (const source of sources) {
    if (!source) {
      continue;
    }
    Object.entries(source).forEach(([file, imports]) => {
      a[file] = a[file] || [];
      a[file].push(...imports);
      a[file] = [...new Set(a[file]).values()];
    });
  }

  return a;
};

const mapImports = (map: Record<string, string[]>): string => {
  return Object.entries(map)
    .reduce((acc: string[], [file, imports]) => {
      return imports?.length ? [...acc, `import { ${imports.sort().join(', ')} } from '${file}';`] : acc;
    }, [])
    .join('\n');
};

const getReplacements = (
  interfaceFile: ts.SourceFile,
  interfaceMethods: NodeInfoMap,
  unimplementedDomainMethods: NodeInfoMap,
  services: Record<string, boolean>
) => {
  const imports: { domain: Record<string, string[]>; service: Record<string, string[]> } = { domain: {}, service: {} };
  const serviceMethods: string[] = [];
  let serviceTemplate: string = '';

  const replacement = Object.keys(interfaceMethods).reduce((text, name) => {
    const {
      imports: toImport,
      serviceClass,
      serviceMethod,
      serviceMethodName,
      domainImplementation,
    } = addImplementation(interfaceFile, unimplementedDomainMethods[name], name);

    mergeImports(imports.domain, toImport.domain);

    if (!services[serviceMethodName]) {
      serviceTemplate = `${serviceTemplate || serviceClass}${serviceMethod}\n`;
      mergeImports(imports.service, toImport.service);
      serviceMethods.push(serviceMethod);
    }

    if (!unimplementedDomainMethods[name].implemented) {
      return `${text}${domainImplementation}`;
    }

    return text;
  }, '');

  serviceTemplate = `${mapImports(imports.service)}\n\n${serviceTemplate}}`;

  return { replacement, serviceClass: serviceTemplate, imports, serviceMethods };
};

const getFileImports = (file: ts.SourceFile): { imports: Record<string, string[]>; nodes: ts.Node[] } => {
  const imports: Record<string, string[]> = {};
  const nodes: ts.Node[] = getSourceNodes(file, [ts.SyntaxKind.ImportDeclaration]);

  for (const node of nodes) {
    let importVars: string[] = [];
    node.getChildren(file).forEach((child) => {
      if (child.kind === ts.SyntaxKind.StringLiteral) {
        const importPath = child.getText(file).replace(/['"]/g, '');
        mergeImports(imports, { [importPath]: importVars });
        importVars = [];
      } else if (child.kind === ts.SyntaxKind.ImportClause) {
        const text = child.getText(file);

        if (!/[{.+}]/.test(text || '')) {
          importVars.push(`default as ${text?.trim()}`);
        } else {
          importVars.push(
            ...text
              .replace(/[{}]/g, '')
              .split(/\s*,\s*/)
              .reduce((keys: string[], key) => (key.trim() ? [...keys, key.trim()] : keys), [])
          );
        }
      }
    });
  }

  return { imports, nodes };
};

const getFileContent = (file: ts.SourceFile, imports: Record<string, string[]>, replacement: [ts.Node, string]): string => {
  let newContent: string = file.getFullText();
  let [original, insertion] = replacement;

  const { nodes, imports: fileImports } = getFileImports(file);
  mergeImports(imports, fileImports);
  const lastNode = nodes.sort((a, b) => a.end - b.end).pop();

  if (!original) {
    const [classDec] = getSourceNodes(file, [ts.SyntaxKind.ClassDeclaration]);
    original = classDec.getChildren(file).find((node) => node.kind === ts.SyntaxKind.FirstPunctuation) as ts.Node;
  }

  const body = newContent.slice(0, original.end) + insertion + newContent.slice(original.end, newContent.length);

  let spacing = '';
  if (!lastNode?.end) {
    spacing = '\n\n';
  }

  return `${mapImports(imports)}${spacing}${body.slice(lastNode?.end || 0)}`;
};

const toast = async (files: { interfaceFile: string; domainFile: string; serviceFile: string }) => {
  const program = ts.createProgram([files.interfaceFile, files.domainFile, files.serviceFile], {});

  const interfaceFile = program.getSourceFile(files.interfaceFile) as ts.SourceFile;
  const interfaceMethods = getNodesOfType(
    interfaceFile,
    [ts.SyntaxKind.MethodSignature],
    basename(interfaceFile.fileName) === 'RainDomainInterface.ts'
  );

  const domainFile = program.getSourceFile(files.domainFile) as ts.SourceFile;
  const domainMethods = getNodesOfType(domainFile, [ts.SyntaxKind.MethodDeclaration]);

  const unimplementedDomainMethods = Object.keys(interfaceMethods).reduce(
    (a: NodeInfoMap, name) => ({ ...a, [name]: { ...interfaceMethods[name], implemented: !!domainMethods[name] } }),
    {}
  );

  const serviceFile = program.getSourceFile(files.serviceFile) as ts.SourceFile;
  let implementedServiceMethods: Record<string, boolean> = {};
  if (serviceFile) {
    const serviceImplementations = getNodesOfType(serviceFile, [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration]);
    implementedServiceMethods = Object.keys(serviceImplementations).reduce((acc, key) => ({ ...acc, [key]: true }), {});
  }

  const { replacement, serviceClass, imports, serviceMethods } = getReplacements(
    interfaceFile,
    interfaceMethods,
    unimplementedDomainMethods,
    implementedServiceMethods
  );

  const lastPublicDomainNode = Object.values(domainMethods)
    .filter((dom) => dom.visibility === 'public')
    .sort((a, b) => a.node.end - b.node.end)
    .pop();

  const newDomain = getFileContent(domainFile, imports.domain, [lastPublicDomainNode?.node as ts.Node, replacement]);

  if (!serviceFile) {
    return { domain: newDomain, service: serviceClass };
  } else {
    if (serviceMethods.length === 0) {
      return { domain: newDomain, service: null };
    }

    const existingServiceMethods = getNodesOfType(serviceFile, [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration]);
    const lastPublicServiceNode = Object.values(existingServiceMethods)
      .filter((dom) => dom.visibility === 'public')
      .sort((a, b) => a.node.end - b.node.end)
      .pop();
    const newService = getFileContent(serviceFile, imports.service, [
      lastPublicServiceNode?.node as ts.Node,
      `${lastPublicServiceNode ? '\n' : ''}${serviceMethods.join('\n')}`,
    ]);

    return { domain: newDomain, service: newService };
  }
};

const renderFunction: RenderFunction = (recipe, renderer) => {
  const domainPath = join(recipe.to as string, 'src', 'domains');

  let once = false;
  renderer.onFile(async (node: VirtualFile) => {
    node.skip = true;

    if (once) {
      return;
    }
    once = true;

    const domains = await promises
      .readdir(domainPath)
      .then((files) => files.reduce((acc: string[], file) => (/\.ts$/.test(file) ? [...acc, join(domainPath, file)] : acc), []));
    for (const domain of domains) {
      const baseName = basename(domain).replace('.ts', ''); // AuthDomain
      const domainFile = domain;
      const interfaceFile = domain.replace(/domains.*/, `http/nodegen/domainInterfaces/${baseName}Interface.ts`);
      const serviceFile = domain.replace(/domains.*/, `services/${getServiceFileName(baseName.replace('Domain', 'Service'))}`);

      const files = await toast({ domainFile, interfaceFile, serviceFile });
      if (files.domain) {
        await promises.writeFile(domainFile, files.domain);
      }
      if (files.service) {
        await promises.writeFile(serviceFile, files.service);
      }
    }

    return;
  });
};

module.exports = renderFunction;

// toast({
//   interfaceFile: process.argv[2],
//   domainFile: process.argv[3],
//   serviceFile: process.argv[4],
// })
//   .then((res) => {
//     // write domain
//     // write service
//     console.log(res);
//   })
//   .catch(console.error);
