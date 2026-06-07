import { Router, type IRouter } from "express";
import healthRouter from "./health";
import telecomRouter from "./telecom";

const router: IRouter = Router();

router.use(healthRouter);
router.use(telecomRouter);

export default router;
