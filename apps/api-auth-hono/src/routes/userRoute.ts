import { Hono } from "hono";
import type { honoTypes } from "../index";

export const userRoute = new Hono<honoTypes>()