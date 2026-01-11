import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, field, value, multipleData } = req.body;

  if (!id) return res.status(400).json({ erro: "ID é obrigatório" });

  const columnMap = {
    'vehicle': 'veiculo',
    'ano_fabricacao': 'ano_fabricacao',
    'ano_modelo': 'ano_modelo',
    'cor': 'cor',
    'status': 'status'
  };

  try {
    let updatePayload = {};

    if (multipleData) {
      // Se enviarmos vários campos (pelo botão Colar)
      Object.keys(multipleData).forEach(key => {
        const targetCol = columnMap[key] || key;
        updatePayload[targetCol] = multipleData[key];
      });
    } else {
      // Se for edição manual de um campo só
      const targetColumn = columnMap[field] || field;
      updatePayload[targetColumn] = value;
    }

    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ sucesso: true });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}