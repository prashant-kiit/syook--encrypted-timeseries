KEYFILE=mongo-keyfile
mongo-keyfile:
	@if [ ! -f $(KEYFILE) ]; then \
		echo "Generating mongo keyfile..."; \
		openssl rand -base64 756 > $(KEYFILE); \
		chmod 400 $(KEYFILE); \
	else \
		echo "mongo-keyfile already exists"; \
	fi

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

stop-v:
	docker compose down -v
