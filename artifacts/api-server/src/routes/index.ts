import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import citiesRouter from "./cities";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(citiesRouter);
router.use(profileRouter);

export default router;
