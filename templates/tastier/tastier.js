"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const ts = __importStar(require("typescript"));
const getChildNodes = (sourceFile, node, kinds) => {
    const nodes = [node];
    const result = [];
    const kindMap = new Map(kinds === null || kinds === void 0 ? void 0 : kinds.map((k) => [k, true]));
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
const getSourceNodes = (sourceFile, kinds) => {
    const nodes = [sourceFile];
    const result = [];
    const kindMap = new Map(kinds === null || kinds === void 0 ? void 0 : kinds.map((k) => [k, true]));
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
const getNodesOfType = (file, kinds, log = false) => {
    const nodes = getSourceNodes(file, kinds);
    const kindMap = new Map(kinds === null || kinds === void 0 ? void 0 : kinds.map((k) => [k, true]));
    const nameToText = {};
    const allImports = getFileImports(file).imports;
    const importsByName = Object.entries(allImports).reduce((acc, [file, imports]) => {
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
                    .reduce((a, k) => (Object.assign(Object.assign({}, a), { [k]: true })), {});
                if (mods.private) {
                    visibility = 'private';
                }
                else if (mods.protected) {
                    visibility = 'protected';
                }
            }
            if (!name && child.kind === ts.SyntaxKind.Identifier) {
                name = child.getText(file);
            }
            else if (!name && kindMap.has(ts.SyntaxKind.ImportDeclaration) && child.kind === ts.SyntaxKind.StringLiteral) {
                name = child.getText(file).replace(/['"]/g, '');
            }
        });
        const imports = {};
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
const getServiceMethod = (name) => {
    const parsed = name.match(/(?<resource>[A-Z]?[a-z]+)(?<id>Id)?(?<method>Get|Post|Delete|Patch)$/);
    if (!parsed) {
        return name;
    }
    const { resource, id, method } = parsed.groups;
    const action = {
        Get: 'list',
        IdGet: 'get',
        Post: 'create',
        IdDelete: 'delete',
        IdPatch: 'update',
        Put: 'upsert',
        IdPut: 'upsert',
    }[`${id || ''}${method}`];
    return `${action}${resource.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}`;
};
const getServiceClassName = (domain) => domain.replace('DomainInterface.ts', 'Service');
const getServiceFileName = (serviceClassName) => serviceClassName
    .replace(/(?:([a-z])([A-Z]))|(?:((?!^)[A-Z])([a-z]))/g, '$1-$3$2$4')
    .toLowerCase()
    .replace('-service', '.service.ts');
const addImplementation = (interfaceFile, domainMethod, name /*, importService: boolean = false*/) => {
    const serviceClassName = getServiceClassName((0, path_1.basename)(interfaceFile.fileName));
    const serviceFileName = getServiceFileName(serviceClassName).replace(/\.ts$/, '');
    const serviceMethodName = getServiceMethod(name);
    let domainImplementation = '';
    let serviceMethod = '';
    if (!domainMethod.implemented) {
        domainImplementation = domainMethod.node.getFullText(interfaceFile).replace(/;$/, ` {
    return ${serviceClassName}.${serviceMethodName}();
  }`);
        serviceMethod = `
  static ${serviceMethodName}(): ${(domainMethod === null || domainMethod === void 0 ? void 0 : domainMethod.returnValue) || 'any'} {
    throw new NotImplementedException();
  }`;
    }
    const domain = mergeImports({}, domainMethod === null || domainMethod === void 0 ? void 0 : domainMethod.imports, !domainMethod.implemented ? { [`@/services/${serviceFileName}`]: [serviceClassName] } : {});
    const service = mergeImports({}, domainMethod === null || domainMethod === void 0 ? void 0 : domainMethod.imports, { '@/http/nodegen/errors': ['NotImplementedException'] });
    const imports = { domain, service };
    const serviceClass = `export class ${serviceClassName} {`;
    return { domainImplementation, imports, serviceMethod, serviceClass, serviceMethodName };
};
const mergeImports = (a = {}, ...sources) => {
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
const mapImports = (map) => {
    return Object.entries(map)
        .reduce((acc, [file, imports]) => {
        return (imports === null || imports === void 0 ? void 0 : imports.length) ? [...acc, `import { ${imports.sort().join(', ')} } from '${file}';`] : acc;
    }, [])
        .join('\n');
};
const getReplacements = (interfaceFile, interfaceMethods, unimplementedDomainMethods, services) => {
    const imports = { domain: {}, service: {} };
    const serviceMethods = [];
    let serviceTemplate = '';
    const replacement = Object.keys(interfaceMethods).reduce((text, name) => {
        const { imports: toImport, serviceClass, serviceMethod, serviceMethodName, domainImplementation, } = addImplementation(interfaceFile, unimplementedDomainMethods[name], name);
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
const getFileImports = (file) => {
    const imports = {};
    const nodes = getSourceNodes(file, [ts.SyntaxKind.ImportDeclaration]);
    for (const node of nodes) {
        let importVars = [];
        node.getChildren(file).forEach((child) => {
            if (child.kind === ts.SyntaxKind.StringLiteral) {
                const importPath = child.getText(file).replace(/['"]/g, '');
                mergeImports(imports, { [importPath]: importVars });
                importVars = [];
            }
            else if (child.kind === ts.SyntaxKind.ImportClause) {
                const text = child.getText(file);
                if (!/[{.+}]/.test(text || '')) {
                    importVars.push(`default as ${text === null || text === void 0 ? void 0 : text.trim()}`);
                }
                else {
                    importVars.push(...text
                        .replace(/[{}]/g, '')
                        .split(/\s*,\s*/)
                        .reduce((keys, key) => (key.trim() ? [...keys, key.trim()] : keys), []));
                }
            }
        });
    }
    return { imports, nodes };
};
const getFileContent = (file, imports, replacement) => {
    let newContent = file.getFullText();
    let [original, insertion] = replacement;
    const { nodes, imports: fileImports } = getFileImports(file);
    mergeImports(imports, fileImports);
    const lastNode = nodes.sort((a, b) => a.end - b.end).pop();
    if (!original) {
        const [classDec] = getSourceNodes(file, [ts.SyntaxKind.ClassDeclaration]);
        original = classDec.getChildren(file).find((node) => node.kind === ts.SyntaxKind.FirstPunctuation);
    }
    const body = newContent.slice(0, original.end) + insertion + newContent.slice(original.end, newContent.length);
    let spacing = '';
    if (!(lastNode === null || lastNode === void 0 ? void 0 : lastNode.end)) {
        spacing = '\n\n';
    }
    return `${mapImports(imports)}${spacing}${body.slice((lastNode === null || lastNode === void 0 ? void 0 : lastNode.end) || 0)}`;
};
const toast = (files) => __awaiter(void 0, void 0, void 0, function* () {
    const program = ts.createProgram([files.interfaceFile, files.domainFile, files.serviceFile], {});
    const interfaceFile = program.getSourceFile(files.interfaceFile);
    const interfaceMethods = getNodesOfType(interfaceFile, [ts.SyntaxKind.MethodSignature], (0, path_1.basename)(interfaceFile.fileName) === 'RainDomainInterface.ts');
    const domainFile = program.getSourceFile(files.domainFile);
    const domainMethods = getNodesOfType(domainFile, [ts.SyntaxKind.MethodDeclaration]);
    const unimplementedDomainMethods = Object.keys(interfaceMethods).reduce((a, name) => (Object.assign(Object.assign({}, a), { [name]: Object.assign(Object.assign({}, interfaceMethods[name]), { implemented: !!domainMethods[name] }) })), {});
    const serviceFile = program.getSourceFile(files.serviceFile);
    let implementedServiceMethods = {};
    if (serviceFile) {
        const serviceImplementations = getNodesOfType(serviceFile, [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration]);
        implementedServiceMethods = Object.keys(serviceImplementations).reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: true })), {});
    }
    const { replacement, serviceClass, imports, serviceMethods } = getReplacements(interfaceFile, interfaceMethods, unimplementedDomainMethods, implementedServiceMethods);
    const lastPublicDomainNode = Object.values(domainMethods)
        .filter((dom) => dom.visibility === 'public')
        .sort((a, b) => a.node.end - b.node.end)
        .pop();
    const newDomain = getFileContent(domainFile, imports.domain, [lastPublicDomainNode === null || lastPublicDomainNode === void 0 ? void 0 : lastPublicDomainNode.node, replacement]);
    if (!serviceFile) {
        return { domain: newDomain, service: serviceClass };
    }
    else {
        if (serviceMethods.length === 0) {
            return { domain: newDomain, service: null };
        }
        const existingServiceMethods = getNodesOfType(serviceFile, [ts.SyntaxKind.MethodSignature, ts.SyntaxKind.MethodDeclaration]);
        const lastPublicServiceNode = Object.values(existingServiceMethods)
            .filter((dom) => dom.visibility === 'public')
            .sort((a, b) => a.node.end - b.node.end)
            .pop();
        const newService = getFileContent(serviceFile, imports.service, [
            lastPublicServiceNode === null || lastPublicServiceNode === void 0 ? void 0 : lastPublicServiceNode.node,
            `${lastPublicServiceNode ? '\n' : ''}${serviceMethods.join('\n')}`,
        ]);
        return { domain: newDomain, service: newService };
    }
});
const renderFunction = (recipe, renderer) => {
    const domainPath = (0, path_1.join)(recipe.to, 'src', 'domains');
    let once = false;
    renderer.onFile((node) => __awaiter(void 0, void 0, void 0, function* () {
        node.skip = true;
        if (once) {
            return;
        }
        once = true;
        const domains = yield fs_1.promises
            .readdir(domainPath)
            .then((files) => files.reduce((acc, file) => (/\.ts$/.test(file) ? [...acc, (0, path_1.join)(domainPath, file)] : acc), []));
        for (const domain of domains) {
            const baseName = (0, path_1.basename)(domain).replace('.ts', ''); // AuthDomain
            const domainFile = domain;
            const interfaceFile = domain.replace(/domains.*/, `http/nodegen/domainInterfaces/${baseName}Interface.ts`);
            const serviceFile = domain.replace(/domains.*/, `services/${getServiceFileName(baseName.replace('Domain', 'Service'))}`);
            const files = yield toast({ domainFile, interfaceFile, serviceFile });
            if (files.domain) {
                yield fs_1.promises.writeFile(domainFile, files.domain);
            }
            if (files.service) {
                yield fs_1.promises.writeFile(serviceFile, files.service);
            }
        }
        return;
    }));
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
