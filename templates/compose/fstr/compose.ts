import { Recipe, Renderer, RenderFunction } from '@acrontum/filesystem-template';
import { promises } from 'fs';

const service = () => {
  []
}

`main-backend:
    container_name: main-backend
    build:
      network: host
      context: ../main-backend
    env_file:
      - ../main-backend/.env.example
      - ./.env
    environment:
      - PORT=${'MAIN_BACKEND_PORT'}
      - PGHOST=pg.test
      - NODE_ENV=production
    ports:
      - "5000:5000"
    depends_on:
      - db
    networks:
      - backend-network
    volumes:
      - ../main-backend/server.ts:/code/server.ts
      - ../main-backend/tsconfig.json:/code/tsconfig.json
      - ../main-backend/tsconfig.prod.json:/code/tsconfig.prod.json
      - ../main-backend/src:/code/src/
      - ../main-backend/openapi-nodegen-api-file.yml:/code/openapi-nodegen-api-file.yml
    working_dir: /code
    command: watch

  db:
    container_name: db
    image: postgres:13.6
    restart: always
    env_file:
      - ./.env
    environment:
      - PGHOST=pg.test
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    networks:
      backend-network:
        aliases:
          - pg.test
    volumes:
      - ./volumes/pg:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1g
    logging:
      driver: none

  parts-api:
    container_name: parts-api
    build:
      context: ./parts-api/
      network: host
    networks:
      - backend-network
    environment:
      - PORT=9999
      - BASE_URL=http://localhost:9999
    init: true
    ports:
      - "9999:9999"

  service-case-backend:
    depends_on:
      - java-common
      - db
    container_name: service-case-backend
    build:
      network: host
      context: ../service-case-backend
      args:
        ADDITIONAL_GRADLE_PARAMS: -x test
    environment:
      - PORT=${'SERVICE_CASE_BACKEND_PORT'}
      - INITIAL_RAM_PERCENTAGE=5
      - MAX_RAM_PERCENTAGE=20
    networks:
      - backend-network
    ports:
      - "5003:8080"
    env_file:
      - .env.example
      - .env

networks:
  ${'project'}-network:
    name: ${'project'}-network
`

const services = (recipe: Recipe): string => {
  for (const service of recipe.data.services) {
    console.log(recipe.map[service]);
  }

  return `\
services:
  abcd:
    container_name: "yolo"
    image: nginx`
}

export const render: RenderFunction = (recipe: Recipe, renderer: Renderer) => {
  renderer.onFile(async (node) => {
    if (node.name === 'docker-compose.yml') {
      const template = await promises.readFile(node.fullSourcePath, 'utf8');

      for (const output of node.getGenerationTargets()) {
        renderer.renderAsTemplateString(template, { project: recipe.name, services })
      }
    }
  })
};

exports = render;
