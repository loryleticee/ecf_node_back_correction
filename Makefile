init:
	rm -rf ./node_modules ./package-lock.json
	docker-compose down
	docker-compose up -d

	npm install
#installation de bcrypt
	npm install bcrypt
	npm install dotenv

db:
#install prisma CLI
	npm add -D prisma
#update db schema
	npx prisma db push

#db migrate
	npx prisma db execute --file ./backup/*.sql --schema ./prisma/schema.prisma

start:
	node server.js

stop:
	docker-compose down

all: init db start