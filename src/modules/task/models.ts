import { TaskType } from "@prisma/client";
import { Type } from "../base.models";

export const CreateTaskModel = Type.Object({
  type: Type.Enum(TaskType),
  deadline: Type.String(),
  steps: Type.Array(Type.String()),
});

export const GetAvailableTaskModel = Type.Object({
  type: Type.String(),
  deadline: Type.String({ format: "date-time" }),
  steps: Type.Array(Type.String()),
  repeating: Type.String(),
  bookingId: Type.Optional(Type.String()),
});
