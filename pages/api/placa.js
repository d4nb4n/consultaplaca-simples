import cheerio from "cheerio";

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
      url: (target) => `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_KEY}&url=${encodeURIComponent(target)}&js_render=true&premium_proxy=true`
    },
    {
      name: "ScrapDo",
      key: process.env.SCRAPDO_KEY,
      url: (target) => `https://api.scrape.do?token=${process.env.SCRAPDO_KEY}&url=${encodeURIComponent(target)}`
    }
  ];

  let mensagemErroFinal = "Nenhum serviço respondeu. Verifique as chaves no Vercel.";

  try {
    for (const site of sites) {
      for (const service of services) {
        if (!service.key) continue;

        try {
          const response = await fetch(service.url(site));
          if (!response.ok) {
            mensagemErroFinal = `${service.name} retornou status ${response.status}`;
            continue;
          }
          
          const html = await response.text();

          if (html && html.length > 500 && !html.includes("Attention Required")) {
            const $ = cheerio.load(html);
            const text = $("body").text().replace(/\s+/g, " ").trim();
            
            let tipo = /Moto|Motocicleta/i.test(text) ? "Moto" : "Carro";
            let marca = text.match(/Marca:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
            let modelo = text.match(/Modelo:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
            let ano = text.match(/\b(19|20)\d{2}\b/)?.[0] || "n/a";
            let cor = ["Prata","Preto","Branco","Vermelho","Azul","Cinza"].find(c => new RegExp(`\\b${c}\\b`, "i").test(text)) || "n/a";

            if (marca || modelo) {
              return res.status(200).json({ 
                placa, tipo, marca, modelo, ano, cor, service: service.name 
              });
            }
          }
        } catch (err) {
          mensagemErroFinal = `Erro no ${service.name}: ${err.message}`;
        }
      }
    }
    return res.status(500).json({ erro: "Dados não encontrados", detalhe: mensagemErroFinal });
  } catch (err) {
    return res.status(500).json({ erro: "Falha crítica", detalhe: err.message });
  }
}
// Versao 2.0