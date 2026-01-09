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
    // AUDITORIA: Lista todos os e-mails na tabela para o log
    const { data: todos } = await supabase.from('usuarios').select('email');
    console.log("E-mails existentes no banco:", todos?.map(u => u.email).join(', '));

    // Busca o usuário
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('email', emailDigitado)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      console.log(`Falha: ${emailDigitado} não existe na lista acima.`);
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    if (String(user.password).trim() !== senhaDigitada) {
      console.log("Falha: Senha incorreta.");
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    // Retorna os dados usando o nome da coluna correto da sua imagem
    return res.status(200).json({ 
      sucesso: true, 
      user: { 
        nome: user.name || user.nome, 
        role: user.role, 
        email: user.email 
      } 
    });

  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}