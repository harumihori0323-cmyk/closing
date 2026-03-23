import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createCustomer, fetchCustomers, updateCustomer } from "../api";
import type { Customer } from "../types";

const FIELDS = [
  { key: "name", label: "名前", type: "input", placeholder: "山田 太郎" },
  { key: "company", label: "会社名", type: "input", placeholder: "株式会社〇〇" },
  { key: "industry", label: "業種", type: "input", placeholder: "IT / 不動産 / 製造 など" },
  { key: "position", label: "役職", type: "input", placeholder: "部長 / 代表取締役 など" },
  { key: "proposal", label: "提案内容", type: "textarea", placeholder: "自社のどのサービス・商品を提案するか" },
  { key: "budget", label: "見積金額", type: "input", placeholder: "500万円" },
  { key: "challenges", label: "顧客の課題・ニーズ", type: "textarea", placeholder: "相手が抱えている課題や要望" },
  { key: "history", label: "過去のやりとり", type: "textarea", placeholder: "これまでの商談経緯・やりとり" },
  { key: "notes", label: "備考", type: "textarea", placeholder: "性格、決裁権の有無、注意点など" },
] as const;

const EMPTY: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCustomers().then((list: Customer[]) => {
      const found = list.find((c) => c.id === id);
      if (found) {
        const data: Record<string, string> = {};
        FIELDS.forEach((f) => { data[f.key] = (found as unknown as Record<string, string>)[f.key] || ""; });
        setForm(data);
      }
    });
  }, [id]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("名前は必須です"); return; }
    setSaving(true);
    if (isEdit) {
      await updateCustomer(id, form);
    } else {
      await createCustomer(form);
    }
    setSaving(false);
    navigate("/");
  };

  return (
    <div>
      <h1>{isEdit ? "顧客情報を編集" : "新規顧客登録"}</h1>
      <form className="card" onSubmit={handleSubmit}>
        {FIELDS.map((f) => (
          <div key={f.key} className="form-group">
            <label>{f.label}{f.key === "name" && " *"}</label>
            {f.type === "input" ? (
              <input
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : (
              <textarea
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
              />
            )}
          </div>
        ))}
        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate("/")}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
