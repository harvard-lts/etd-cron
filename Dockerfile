FROM node:lts-slim

ENV LANG=C.UTF-8
ENV APP_ID_NUMBER=55031
ENV APP_ID_NAME=etdadm
ENV GROUP_ID_NUMBER=1636
ENV GROUP_ID_NAME=appcommon

RUN apt-get -y update && \
    DEBIAN_FRONTEND=non-interactive && \
    groupadd -g ${GROUP_ID_NUMBER} ${GROUP_ID_NAME} && \
    useradd -l -s /bin/bash -m -u ${APP_ID_NUMBER} -g etdadm ${APP_ID_NAME}

WORKDIR /home/${APP_ID_NAME}

COPY --chown=${APP_ID_NAME}:${GROUP_ID_NAME} cron.js logger.js package.json package-lock.json  ./
RUN chown -R ${APP_ID_NAME}:${GROUP_ID_NAME} /home/${APP_ID_NAME}

# Guarantees umask is set properly to alleviate issue with umask not sticking inside the node container
# This is to ensure permissions of files stored on the server will be given the correct permissions
# This is required for node apps that write files out to the host filesystem
RUN echo 'umask 002' >> /home/${APP_ID_NAME}/.profile && \
  echo 'umask 002' >> /home/${APP_ID_NAME}/.bashrc

RUN npm install && \
npm install celery-node

RUN chown -R ${APP_ID_NAME}:${GROUP_ID_NAME} /home/${APP_ID_NAME}
USER ${APP_ID_NAME}

CMD ["node", "./cron.js"]
