import { Recipe, Renderer, RenderFunction } from '@acrontum/filesystem-template';
import { promises } from 'fs';
import { relative } from 'path';

const baseDocker = (name: string, path: string): string[] => {
  return [
    `  ${name}:`,
    `    container_name: ${name}`,
    '    build:',
    `      context: ${path}`,
    '      network: host',
    '    networks:',
    '      - backend-network',
    '    env_file:',
    '      - ./.env',
  ];
};

const getServiceForType = {
  postgres: (name: string, path: string) => {
    return [
      `  ${name}:`,
      `    container_name: ${name}`,
      '    image: postgres:13.6',
      '    restart: always',
      '    env_file:',
      '      - ./.env',
      '    environment:',
      '      - POSTGRES_PASSWORD=postgres',
      '    ports:',
      '      - "5432:5432"',
      '    networks:',
      '      - backend-network',
      '    volumes:',
      '      - ./volumes/pg:/var/lib/postgresql/data',
    ].join('\n');
  },
  node: (name: string, path: string, type: string) => {
    return baseDocker(name, path).concat(['    environment:', '      NODE_ENV: "production"']).join('\n');
  },
  java: (name: string, path: string, type: string) => {
    return baseDocker(name, path).concat(['    environment:', '      MEM_USAGE: "600TB"']).join('\n');
  },
};

const detectTemplateType = async (path: string) => {
  const files = await promises.readdir(path);
  for (const file of files) {
    if (file === 'package.json') {
      return 'node';
    }
    if (file === 'build.gradle') {
      return 'java';
    }
  }

  return 'default';
};

const getServiceBuilder = (recipe: Recipe): (() => Promise<string>) => {
  return async () => {
    const services: string[] = [];

    for (const [name, service] of Object.entries(recipe.data.services) as [string, { name: string; type: string }][]) {
      const serviceRecipe = recipe.map[name];
      const templateType = (service as any).type || (await detectTemplateType(serviceRecipe.to));

      services.push(getServiceForType[templateType](service?.name || name, serviceRecipe?.to ? relative(recipe.to, serviceRecipe?.to) : ''));
    }
    if (services.length === 0) {
      return '';
    }

    return `services:\n${services.join('\n\n')}`;
  };
};

const render: RenderFunction = (recipe: Recipe, renderer: Renderer) => {
  const services = getServiceBuilder(recipe);

  renderer.onFile(async (node) => {
    if (node.name !== 'docker-compose.yml') {
      if (node.isDir && node.name === 'fstr') {
        node.skip = true;
      }

      return;
    }

    const template = await promises.readFile(node.fullSourcePath, 'utf8');

    for (const output of node.getGenerationTargets()) {
      const content = await renderer.renderAsTemplateString(template, { project: recipe.name, services });
      await promises.writeFile(output, content);

      return [output];
    }
  });
};

module.exports = render;
