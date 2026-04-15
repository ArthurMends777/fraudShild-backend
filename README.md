# 🚀 FraudShield Backend

API antifraude construída com Node.js, TypeScript, Prisma e PostgreSQL.

---

## 🧱 Tecnologias

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL

---

## ⚙️ Configuração do ambiente

Antes de rodar o projeto, configure as variáveis de ambiente.

### 1. Crie o arquivo `.env`

Use o `.env.example` como base:

```bash
cp .env.example .env
```

### 2. Configure as variáveis

Exemplo:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/fraudshield"
PORT=3000
NODE_ENV=development
```

---

## 📦 Instalação

```bash
npm install
```

---

## 🗄️ Banco de dados

```bash
npx prisma migrate dev
```

---

## ▶️ Rodando o projeto

```bash
npm run dev
```

---

## 📌 Observações
* Utilize o `.env.example` como referência
