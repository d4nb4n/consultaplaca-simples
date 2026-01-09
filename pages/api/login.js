import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const emailDigitado = req.body.email?.trim().toLowerCase();
  const senhaDigitada = String(req.body.password || '').trim();

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailDigitado)
      .maybeSingle();

    if (error || !user || user.password !== senhaDigitada) {
      return res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }

    // Retornamos 'success' e 'sucesso' para garantir que o frontend entenda
    return res.status(200).json({ 
      success: true,
      sucesso: true, 
      user: { 
        nome: user.nome, 
        role: user.role, 
        email: user.email 
      },
      token: "login_efetuado_com_sucesso" // Alguns frontends exigem um token presente
    });

  } catch (err) {
    return res.status(500).json({ success: false, erro: err.message });
  }
}