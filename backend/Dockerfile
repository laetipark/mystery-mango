FROM eclipse-temurin:21-jdk-jammy@sha256:6adefddd4a20bceef702cedb0b03952fcd7691f9c7ccffe27014992abc0b46bd AS build
WORKDIR /workspace
COPY . .
RUN chmod +x gradlew && ./gradlew --no-daemon bootJar
FROM eclipse-temurin:21-jre-jammy@sha256:e9aaf73145bbd1f9f6ec7f6867dd75a44f34b1a6c32a813504bf4129be2d09d7
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* && useradd --system --uid 10001 mango
WORKDIR /app
COPY --from=build /workspace/build/libs/mystery-mango-0.1.0.jar app.jar
RUN mkdir -p /app/assets && chown mango /app/assets
USER mango
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
