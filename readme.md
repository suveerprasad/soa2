# Setup Commands

## Start the services:

```bash
docker-compose up -d --build
```
### Verify all containers are running:

```bash
docker-compose ps
```

## Demonstration Commands

1. Show RabbitMQ Management Console

```bash
start http://localhost:15672
```
Username: guest
Password: guest

Check under:

Queues tab → Verify order_processing queue exists
Exchanges tab → Verify orders exchange exists

2. Monitor Publisher Logs

```bash
docker-compose logs -f publisher
```

3. Monitor Consumer Logs

```bash
docker-compose logs -f consumer
```
