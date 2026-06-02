FROM jenkins/jenkins:lts

USER root

RUN apt-get update && \
    apt-get install -y docker.io curl && \
    apt-get clean

RUN usermod -aG docker jenkins

USER jenkins