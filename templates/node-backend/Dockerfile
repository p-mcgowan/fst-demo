FROM node:16 as build

WORKDIR /code

COPY ./package.json ./package-lock.json /code/
RUN npm ci

COPY . /code/
RUN npm run --if-present build

# -----------------------------------------------------
FROM node:16-alpine as runtime

WORKDIR /code

COPY --from=build /code/package.json /code/package.json
COPY --from=build /code/package-lock.json /code/package-lock.json
RUN npm i --omit=dev

COPY --from=build /code/build /code/build

ENTRYPOINT [ "node" ]
CMD ["app.js"]
