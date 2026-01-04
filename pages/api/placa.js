export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: "Placa obrigatória" });

  const placa = String(id).trim().toUpperCase();

  const sites = [
    `https://puxaplaca.com.br/placa/${placa}`,
    `https://www.keplaca.com/placa?placa-fipe=${placa}`
  ];

  const services = [
    {
      name: "ZenRows",
      key: process.env.ZENROWS_KEY,
      url: (target) => `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_KEY}&url=${encodeURIComponent(target)}`
    },
    {
      name: "ScrapDo",
      key: process.env.SCRAPDO_KEY,
      url: (target) => `https://api.scrape.do?token=${process.env.SCRAPDO_KEY}&url=${encodeURIComponent(target)}`
    }
  ];

  try {
    let lastError = null;

    for (const site of sites) {
      for (const service of services) {
        if (!service.key) {
          console.warn(`Chave ausente para ${service.name}`);
          continue;
        }
        try {
          const response = await fetch(service.url(site));
          if (!response.ok) throw new Error(`${service.name} falhou`);
          const html = await response.text();

          if (!html.includes("Attention Required")) {
            return res.status(200).json({ placa, site, service: service.name, html });
          }
        } catch (err) {
          lastError = err;
          console.error(`Erro com ${service.name} em ${site}:`, err.message);
        }
      }
    }

    return res.status(500).json({ erro: "Nenhum serviço conseguiu consultar", detalhe: lastError?.message });
  } catch (err) {
    return res.status(500).json({ erro: "Falha geral", detalhe: err.message });
  }
}
