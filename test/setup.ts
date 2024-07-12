import { Command, CommandExecutor } from "@effect/platform";
import { NodeCommandExecutor, NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { beforeAll } from "vitest";

beforeAll(() => {
  Effect.gen(function* () {
    const executor = yield* CommandExecutor.CommandExecutor;

    const command = Command.make("pnpx", "convex codegen");

    yield* executor.start(command);
  }).pipe(
    Effect.scoped,
    Effect.provide(NodeCommandExecutor.layer),
    Effect.provide(NodeFileSystem.layer),
    Effect.runPromise,
  );
});
