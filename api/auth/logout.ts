import { setDiskominfoCorsHeaders } from '../securityHelper';

export default async function handler(req: any, res: any) {
  const isHandled = setDiskominfoCorsHeaders(req, res);
  if (isHandled) return;

  return res.status(200).json({ success: true, message: 'Sesi berhasil dicabut dan dinonaktifkan.' });
}
