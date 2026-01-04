export default async function handler(req, res) {
	 // 🔍 Log da variável de ambiente para debug
  console.log("Método recebido:", req.method);
  console.log("Authorization recebido:", req.headers.authorization);
  console.log("API_SECRET carregado:", process.env.API_SECRET);

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }
  // 🔒 Verificação de token secreto
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ erro: "Não autorizado" });
  }

  // 📥 Dados recebidos do formulário
  let { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  // Normalização simples
  telefone = telefone?.trim();
  email = email?.toLowerCase().trim();
  placa = placa?.toUpperCase().trim();

  // ✅ Validação dos campos obrigatórios
  if (!nome || !telefone || !email || !cep || !placa || !blindado || !importado || !utilizacao) {
    return res.status(400).json({ erro: "Campos obrigatórios faltando" });
  }

  try {
    // 🔎 Consulta da placa internamente
    const consulta = await fetch(
      `https://consultaplaca-simples.vercel.app/api/placa?id=${placa}`
    );

    if (!consulta.ok) {
      return res.status(502).json({ erro: "Falha ao consultar placa" });
    }

    const dadosPlaca = await consulta.json();

    // 📦 Objeto final
    const leadCompleto = {
      nome,
      telefone,
      email,
      cep,
      placa,
      blindado,
      importado,
      utilizacao,
      veiculo: dadosPlaca
    };

    // (Planejado) salvar leadCompleto no banco
    // (Planejado) enviar mensagem para WhatsApp do consultor

    // ✅ Retorno para o frontend
    return res.status(200).json({ sucesso: true, lead: leadCompleto });
  } catch (err) {
    return res.status(500).json({ erro: "Falha no cadastro", detalhe: err.message });
  }
}
