import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryName } from "./app.ts";

test("preset categories follow the app language", () => {
  assert.equal(categoryName({ name: "Propostas", preset: "proposals" }, "en"), "Proposals");
  assert.equal(categoryName({ name: "Waiting for tasks", preset: "waiting" }, "pt-BR"), "Espera por tarefas");
});

test("the same preset key can have different names per type of work", () => {
  assert.equal(categoryName({ name: "Administração e cobrança", preset: "admin" }, "en"), "Admin and invoicing");
  assert.equal(categoryName({ name: "Administração", preset: "admin" }, "en"), "Admin");
});

test("a renamed or custom category keeps its name", () => {
  assert.equal(categoryName({ name: "Clientes novos", preset: "proposals" }, "en"), "Clientes novos");
  assert.equal(categoryName({ name: "Edição", preset: null }, "en"), "Edição");
});
