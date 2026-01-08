import cheerio from "cheerio";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: "Placa obrigatória" });

  const placa = String(id).trim().toUpperCase();
  const sites = [
    `https://www.keplaca.com/placa?placa-fipe=${placa}`,
    `https://puxaplaca.com.br/placa/${placa}`
  ];

  const services = [
    {
      name: "ZenRows",
      key: process.env.ZENROWS_KEY,
      url: (target) => `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_KEY}&url=${encodeURIComponent(target)}&js_render=true`
    },
    {
      name: "ScrapDo",
      key: process.env.SCRAPDO_KEY,
      url: (target) => `https://api.scrape.do?token=${process.env.SCRAPDO_KEY}&url=${encodeURIComponent(target)}&render=true`
    }
  ];

  for (const site of sites) {
    for (const service of services) {
      if (!service.key) continue;
      try {
        const response = await fetch(service.url(site));
        if (!response.ok) continue;
        
        const html = await response.text();
        if (html.length > 500 && !html.includes("Attention Required")) {
          const $ = cheerio.load(html);
          const textoPuro = $("body").text().replace(/\s+/g, " ");

          // Extração via Regex no servidor
          const marca = textoPuro.match(/Marca:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
          const modelo = textoPuro.match(/Modelo:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
          const ano = textoPuro.match(/\b(19|20)\d{2}\b/)?.[0] || "n/a";

          if (marca || modelo) {
            return res.status(200).json({ 
              sucesso: true,
              marca_modelo: `${marca.trim()} ${modelo.trim()}`.trim(),
              ano: ano,
              fonte: service.name
            });
          }
        }
      } catch (err) {
        console.error(`Erro no serviço ${service.name}:`, err.message);
      }
    }
  }

  // Fallback para não quebrar o cadastro.js
  return res.status(200).json({ marca_modelo: "Consulta Manual", ano: "Pendente" });
}