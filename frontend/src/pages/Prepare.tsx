import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCustomers, getClosingAdvice } from "../api";
import type { Customer } from "../types";

export default function Prepare() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCustomers().then((list: Customer[]) => {
      const found = list.find((c) => c.id === id);
      setCustomer(found || null);
      setLoading(false);
    });
  }, [id]);

  const generate = async () => {
    if (!customer) return;
    setGenerating(true);
    setAdvice("");
    const result = await getClosingAdvice(customer as unknown as Record<string, string>);
    setAdvice(result.advice);
    setGenerating(false);
  };

  useEffect(() => {
    if (customer) generate();
  }, [customer]);

  if (loading) {
    return <div className="loading"><div className="spinner" /> 読み込み中...</div>;
  }

  if (!customer) {
    return <div className="card">顧客が見つかりません。<Link to="/">戻る</Link></div>;
  }

  return (
    <div>
      <h1>クロージング準備 — {customer.name}</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>顧客情報</h2>
        <table style={{ width: "100%", fontSize: 14 }}>
          <tbody>
            <tr><td style={{ fontWeight: 600, padding: "4px 12px 4px 0", whiteSpace: "nowrap" }}>会社名</td><td>{customer.company}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: "4px 12px 4px 0", whiteSpace: "nowrap" }}>業種</td><td>{customer.industry}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: "4px 12px 4px 0", whiteSpace: "nowrap" }}>役職</td><td>{customer.position}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: "4px 12px 4px 0", whiteSpace: "nowrap" }}>提案内容</td><td>{customer.proposal}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: "4px 12px 4px 0", whiteSpace: "nowrap" }}>見積金額</td><td>{customer.budget}</td></tr>
            <tr><td style={{ fontWeight: 600, padding: "4px 12px 4px 0", whiteSpace: "nowrap" }}>課題</td><td>{customer.challenges}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>AIアドバイス</h2>
          <button className="btn btn-outline" onClick={generate} disabled={generating}>
            {generating ? "生成中..." : "再生成"}
          </button>
        </div>
        {generating ? (
          <div className="loading"><div className="spinner" /> アドバイスを生成中...</div>
        ) : advice ? (
          <div style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.8 }}>{advice}</div>
        ) : null}
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <Link to={`/session/${customer.id}`} className="btn btn-success">クロージング開始</Link>
        <Link to="/" className="btn btn-outline">戻る</Link>
      </div>
    </div>
  );
}
