import { Prisma, PrismaClient } from "@prisma/client";
import { fastify, FastifyInstance, RouteOptions } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import fastifySwagger from "fastify-swagger";
import { resolve } from "path";
import { response } from "express";
import { send500 } from "./utils/errors";

const prisma = new PrismaClient();
const app = fastify({ logger: true });

// write utility for gathering tags from "component" folders
const tags: Array<{ name: string; description: string }> = [];

app.register(fastifySwagger, {
  exposeRoute: true,
  routePrefix: "/docs",
  swagger: {
    info: { title: "fastify-api", version: "0.1.0" },
  },
});

// write utility for gathering routes from "component" folders
const routes: Array<(fastify: FastifyInstance, options: RouteOptions) => void> =
  [];
routes.forEach((route) => {
  app.register(route);
});

app.get("/", {}, async (request, reply) => {
  reply.send("hello");
});

app.get("/users", async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    reply.status(200).send(users);
  } catch (err) {
    send500(reply);
  }
});

const CreateUserModel = Type.Object({
  email: Type.String({ format: "email" }),
  firstName: Type.String({ minLength: 2 }),
  lastName: Type.String({ minLength: 2 }),
  password: Type.String({ minLength: 6 }),
});

app.post<{ Body: Static<typeof CreateUserModel> }>(
  "/users",
  {
    schema: {
      body: CreateUserModel,
    },
  },
  async (request, reply) => {
    try {
      const user = await prisma.user.create({
        data: {
          ...request.body,
        },
      });
      reply.send(user.id);
    } catch (err) {
      send500(reply);
    }
  }
);

const UpdateUserModel = Type.Object({
  email: Type.Optional(Type.String({ format: "email" })),
  firstName: Type.Optional(Type.String({ minLength: 2 })),
  lastName: Type.Optional(Type.String({ minLength: 2 })),
  password: Type.Optional(Type.String({ minLength: 6 })),
});

app.put<{ Body: Static<typeof UpdateUserModel>; Params: { id: string } }>(
  "/users/:id",
  {
    schema: {
      params: {
        id: Type.String({ format: "uuid" }),
      },
      body: UpdateUserModel,
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...request.body,
        },
      });
      reply.send(`Sucessfully updated user: ${id}`);
    } catch (err) {
      send500(reply);
    }
  }
);

app.delete<GetUserType>(
  "/users/:id",
  {
    schema: {
      params: {
        id: Type.String({ format: "uuid" }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const deleteUser = await prisma.user.delete({
        where: { id },
      });
      reply.send(`Sucessfully deleted: ${id}`);
    } catch (err) {
      send500(reply);
    }
  }
);

type GetUserType = {
  Params: {
    id: string;
  };
};

app.get<GetUserType>(
  "/users/:id",
  {
    schema: {
      params: {
        id: Type.String({ format: "uuid" }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      reply.send(user);
    } catch (err) {
      send500(reply);
    }
  }
);

// get Reactions

type GetReactionType = {
  Params: {
    id: string;
  };
};

app.get<GetReactionType>(
  "/messages/:id/reactions",
  {
    schema: {
      params: {
        id: Type.String({ format: "uuid" }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const reactions = await prisma.reactions.findMany({
        where: { messageId: id },
      });
      reply.send(reactions);
    } catch (err) {
      send500(reply);
    }
  }
);

// delete reactions

app.delete<GetReactionType>(
  "/reactions/:id",
  {
    schema: {
      params: {
        id: Type.String({ format: "uuid" }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const deleteReaction = await prisma.reactions.delete({
        where: { id },
      });
      reply.send(`Sucessfully deleted: ${id}`);
    } catch (err) {
      send500(reply);
    }
  }
);

//post reactions
const CreateReactionModel = Type.Object({
  emoji: Type.String(),
});

app.post<{ Body: Static<typeof CreateReactionModel>; Params: { id: string } }>(
  "/messages/:id/reactions",
  {
    schema: {
      body: CreateReactionModel,
      params: {
        id: Type.String({ format: "uuid" }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;
    try {
      const reaction = await prisma.reactions.create({
        data: {
          ...request.body,
          message: { connect: { id: id } },
        },
      });
      reply.send(reaction.emoji);
    } catch (err) {
      send500(reply);
    }
  }
);

const start = async () => {
  try {
    await app.listen(8000, "0.0.0.0");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
