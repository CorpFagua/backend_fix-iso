import { Request, Response } from 'express';

export const getExample = (req: Request, res: Response): void => {
  res.json({ message: 'This is an example controller' });
};
