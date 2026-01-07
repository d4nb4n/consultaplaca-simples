export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  // 📥 Dados recebidos do formulário
  let { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  try {
    // Consulta a API de placa que acabamos de atualizar
    const consulta = await fetch(
      `https://consultaplaca-simples.vercel.app/api/placa?id=${placa}`
    );

    if (!consulta.ok) {
      return res.status(502).json({ erro: "Falha ao consultar placa" });
    }

    const dadosPlaca = await consulta.json();

    // 🏗️ Monta o Lead organizando os dados do veículo
    const leadCompleto = {
      nome,
      telefone,
      email,
      cep,
      placa: placa.toUpperCase(),
      blindado,
      importado,
      utilizacao,
      // Agora pegamos os dados específicos que o novo placa.js retorna
      veiculo: {
        tipo: dadosPlaca.tipo || "Carro", // Moto ou Carro
        marca: dadosPlaca.marca || "n/a",
        modelo: dadosPlaca.modelo || "n/a",
        ano: dadosPlaca.ano || "n/a",
        cor: dadosPlaca.cor || "n/a"
      },
      status: "Novo",
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({ sucesso: true, lead: leadCompleto });
  } catch (err) {
    return res.status(500).json({ erro: "Falha no cadastro", detalhe: err.message });
  }
}