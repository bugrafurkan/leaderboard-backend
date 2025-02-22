import { Request, Response } from 'express';
import {SignOptions, sign, Secret} from 'jsonwebtoken';
import { ENV } from '../config/env';

interface TokenPayload {
  username: string;
}

export const authController = {
  login(req: Request, res: Response) {
    const { username, password } = req.body;

    const signOptions: SignOptions = {
      expiresIn: '1d'
    };

    try {
      const token = sign(
        { username } as TokenPayload,
        ENV.JWT_SECRET,
        signOptions
      );

      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: 'Token generation failed' });
    }
  }
};
