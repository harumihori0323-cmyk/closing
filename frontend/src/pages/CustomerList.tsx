import { useEffect, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCustomers, deleteCustomer } from "../api";
import type { Customer } from "../types";

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, refresh] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    let cancelled = false;
    fetchCustomers().then((data: Customer[]) => {
      if (!cancelled) {
        setCustomers(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    await deleteCustomer(id);
    refresh();
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /> 読み込み中...</div>;
  }

  if (customers.length === 0) {
    return (
      <div>
        <h1>顧客一覧</h1>
        <div className="card" style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ fontSize: 16, color: "var(--text-light)", marginBottom: 16 }}>
            まだ顧客が登録されていません
          </p>
          <Link to="/register" className="btn btn-primary">顧客を登録する</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>顧客一覧</h1>
        <Link to="/register" className="btn btn-primary">+ 新規登録</Link>
      </div>
      {customers.map((c) => (
        <div key={c.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0 }}>{c.name}</h2>
              <p style={{ color: "var(--text-light)", fontSize: 14 }}>
                {c.company} / {c.industry} / {c.position}
              </p>
              {c.proposal && (
                <p style={{ fontSize: 14, marginTop: 8 }}>
                  <strong>提案:</strong> {c.proposal}
                </p>
              )}
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <Link to={`/prepare/${c.id}`} className="btn btn-primary">準備アドバイス</Link>
            <Link to={`/session/${c.id}`} className="btn btn-success">クロージング開始</Link>
            <Link to={`/edit/${c.id}`} className="btn btn-outline">編集</Link>
            <button className="btn btn-danger" onClick={() => handleDelete(c.id, c.name)}>削除</button>
          </div>
        </div>
      ))}
    </div>
  );
}
