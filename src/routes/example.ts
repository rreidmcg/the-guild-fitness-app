import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";

export const exampleRouter = Router();

const Params = z.object({ id: z.string().uuid() });
const Body = z.object({ name: z.string().min(1) });

exampleRouter.post(
  "/example/:id",
  validate({ params: Params, body: Body }),
  (req, res) => {
    res.json({ ok: true, id: req.params.id, name: req.body.name });
  }
);