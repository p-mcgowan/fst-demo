"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const baseDocker = (name, path) => {
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
    postgres: (name, path) => {
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
    node: (name, path, type) => {
        return baseDocker(name, path).concat(['    environment:', '      NODE_ENV: "production"']).join('\n');
    },
    java: (name, path, type) => {
        return baseDocker(name, path).concat(['    environment:', '      MEM_USAGE: "600TB"']).join('\n');
    },
};
const detectTemplateType = async (path) => {
    const files = await fs_1.promises.readdir(path);
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
const getServiceBuilder = (recipe) => {
    return async () => {
        const services = [];
        for (const [name, service] of Object.entries(recipe.data.services)) {
            const serviceRecipe = recipe.map[name];
            const templateType = service.type || (await detectTemplateType(serviceRecipe.to));
            services.push(getServiceForType[templateType]((service === null || service === void 0 ? void 0 : service.name) || name, (serviceRecipe === null || serviceRecipe === void 0 ? void 0 : serviceRecipe.to) ? (0, path_1.relative)(recipe.to, serviceRecipe === null || serviceRecipe === void 0 ? void 0 : serviceRecipe.to) : ''));
        }
        if (services.length === 0) {
            return '';
        }
        return `services:\n${services.join('\n\n')}`;
    };
};
const render = (recipe, renderer) => {
    const services = getServiceBuilder(recipe);
    renderer.onFile(async (node) => {
        if (node.name !== 'docker-compose.yml') {
            if (node.isDir && node.name === 'fstr') {
                node.skip = true;
            }
            return;
        }
        const template = await fs_1.promises.readFile(node.fullSourcePath, 'utf8');
        for (const output of node.getGenerationTargets()) {
            const content = await renderer.renderAsTemplateString(template, { project: recipe.name, services });
            await fs_1.promises.writeFile(output, content);
            return [output];
        }
    });
};
module.exports = render;
