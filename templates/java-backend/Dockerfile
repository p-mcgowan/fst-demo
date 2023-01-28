FROM openjdk:17

WORKDIR /code/

COPY ./ ./

RUN ./gradlew build --no-daemon --stacktrace


FROM openjdk:17-slim

COPY --from=build /code/build/**/*.jar /opt/java/applications/

ENTRYPOINT ["java", "-jar", "/opt/java/applications/*.jar"]
