"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Coins,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LoaderCircle,
  Receipt,
  Search,
} from "lucide-react";
import { formatDH } from "@/lib/format";
import { Card, selectCls } from "@/components/ui";
import type { DatasetStats } from "@/lib/reports";

const COLS = [
  { key: "groups", label: "Groupes & Matières" },
  { key: "phone", label: "Téléphone & Parent" },
  { key: "status", label: "Statut d'inscription" },
];

export type GroupOption = {
  id: number;
  name: string;
  specialtyName: string;
  levelName: string;
};

export type ReportPreview = {
  title: string;
  subtitle: string | null;
  head: string[];
  rows: (string | number)[][];
  total: number;
  money: number[];
  stats?: DatasetStats | null;
};

export function ReportBuilder({
  type,
  withCols,
  firstCol,
  schoolName,
  groups,
  defaultAsOf,
  initial,
}: {
  type: string;
  withCols: boolean;
  firstCol: string;
  schoolName: string;
  groups: GroupOption[];
  defaultAsOf?: string;
  initial: ReportPreview;
}) {
  const isUnpaid = type === "unpaid";
  const isInvoices = type === "invoices";

  const todayInput = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf] = useState(defaultAsOf ?? todayInput);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [onlyLate, setOnlyLate] = useState(false);
  const [months, setMonths] = useState("1"); // 1 = mois sélectionné, 2 = 2 derniers mois, all = historique
  const [cols, setCols] = useState<Record<string, boolean>>({ groups: true, phone: true, status: true });

  const [preview, setPreview] = useState<ReportPreview>(initial);
  const [pending, setPending] = useState(false);
  const firstRun = useRef(true);

  const colsParam = COLS.filter((c) => cols[c.key]).map((c) => c.key).join(",");

  // Helper date presets for unpaid situation
  const setPresetAsOf = (preset: "today" | "endOfMonth" | "tenthOfMonth" | "firstOfMonth" | "clear") => {
    const now = new Date();
    if (preset === "today") {
      setAsOf(now.toISOString().slice(0, 10));
    } else if (preset === "endOfMonth") {
      const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      setAsOf(lastDay.toISOString().slice(0, 10));
    } else if (preset === "tenthOfMonth") {
      const tenth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10));
      setAsOf(tenth.toISOString().slice(0, 10));
    } else if (preset === "firstOfMonth") {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      setAsOf(first.toISOString().slice(0, 10));
    } else if (preset === "clear") {
      setAsOf("");
    }
  };

  const buildParams = useCallback(() => {
    const sp = new URLSearchParams({ type });
    if (isUnpaid) {
      if (asOf) sp.set("asOf", asOf);
      sp.set("months", months);
      if (from) sp.set("from", from);
      if (onlyLate) sp.set("onlyLate", "1");
    } else {
      if (from) sp.set("from", from);
      if (to) sp.set("to", to);
      if (onlyLate) sp.set("onlyLate", "1");
    }
    if (groupId) sp.set("groupId", groupId);
    if (searchQuery.trim()) sp.set("q", searchQuery.trim());
    if (status) sp.set("status", status);
    if (withCols) sp.set("cols", colsParam);
    return sp;
  }, [type, isUnpaid, asOf, from, to, onlyLate, months, groupId, searchQuery, status, withCols, colsParam]);

  const href = (format: "pdf" | "xlsx", extra?: Record<string, string>) => {
    const sp = buildParams();
    sp.set("format", format);
    for (const [k, v] of Object.entries(extra ?? {})) sp.set(k, v);
    return `/api/reports?${sp.toString()}`;
  };

  // Sync preview via debounce
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const sp = buildParams();
    const ctrl = new AbortController();
    setPending(true);

    const id = setTimeout(() => {
      fetch(`/api/reports/preview?${sp.toString()}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<ReportPreview>) : null))
        .then((data) => {
          if (data) setPreview(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!ctrl.signal.aborted) setPending(false);
        });
    }, 220);

    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [buildParams]);

  const stats = preview.stats;

  return (
    <div className="space-y-6">
      {/* ── KPI EXECUTIVE SUMMARY BAR ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex items-center gap-3.5 p-4 bg-white border-line shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Lignes / Factures</p>
              <p className="text-xl font-extrabold text-navy-950">{stats.totalCount}</p>
            </div>
          </Card>

          {stats.totalDue !== undefined && (
            <Card className="flex items-center gap-3.5 p-4 bg-white border-line shadow-xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
                <Coins size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Montant Total Dû</p>
                <p className="text-xl font-extrabold text-navy-950">{formatDH(stats.totalDue)}</p>
              </div>
            </Card>
          )}

          {stats.totalPaid !== undefined && (
            <Card className="flex items-center gap-3.5 p-4 bg-white border-line shadow-xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Montant Encaissé</p>
                <p className="text-xl font-extrabold text-emerald-700">{formatDH(stats.totalPaid)}</p>
              </div>
            </Card>
          )}

          {stats.totalRemaining !== undefined && (
            <Card className="flex items-center gap-3.5 p-4 bg-rose-50/70 border-rose-200/80 shadow-xs">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-rose-700">Reste à Recouvrer</p>
                  {stats.totalLateCount !== undefined && stats.totalLateCount > 0 && (
                    <span className="rounded-full bg-rose-200 px-1.5 py-0.2 text-[10px] font-extrabold text-rose-800">
                      {stats.totalLateCount} en retard
                    </span>
                  )}
                </div>
                <p className="text-xl font-extrabold text-rose-700">{formatDH(stats.totalRemaining)}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── TWO-COLUMN WORKBENCH: FILTERS & PREVIEW ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Filter Panel (5 cols) */}
        <Card className="p-5 lg:col-span-4 space-y-5 border-line shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3.5">
            <div className="flex items-center gap-2">
              <Filter size={17} className="text-brand-600" />
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wide">Filtres Intelligents</h2>
            </div>
            {(groupId || searchQuery || status || onlyLate || (isUnpaid ? asOf !== defaultAsOf || months !== "1" : from || to)) && (
              <button
                type="button"
                onClick={() => {
                  setGroupId("");
                  setSearchQuery("");
                  setStatus("");
                  setOnlyLate(false);
                  setMonths("1");
                  setFrom("");
                  setTo("");
                  if (defaultAsOf) setAsOf(defaultAsOf);
                }}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* 1. Date filter section */}
          {isUnpaid ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                  <Calendar size={14} className="text-brand-600" />
                  Date de situation (Arrêté au)
                </label>
                <span className="text-[11px] font-semibold text-brand-700">
                  {months === "1" ? "Mois sélectionné" : months === "2" ? "2 derniers mois" : "Historique inclus"}
                </span>
              </div>
              <input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className={`${selectCls} w-full font-medium`}
                aria-label="Arrêté à la date"
              />

              {/* Plage — entièrement filtrable à partir de la date choisie */}
              <div className="pt-1">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                  Plage des impayés
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMonths("1")}
                    className={`rounded-lg px-2 py-2 text-[11px] font-bold transition border ${
                      months === "1"
                        ? "bg-navy-900 text-white border-navy-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Ce mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonths("2")}
                    className={`rounded-lg px-2 py-2 text-[11px] font-bold transition border ${
                      months === "2"
                        ? "bg-navy-900 text-white border-navy-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    2 derniers mois
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonths("all")}
                    className={`rounded-lg px-2 py-2 text-[11px] font-bold transition border ${
                      months === "all"
                        ? "bg-navy-900 text-white border-navy-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Historique
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                  {months === "1"
                    ? "Uniquement les cycles entamés dans le mois de la date choisie, jusqu'à cette date."
                    : months === "2"
                      ? "Cycles entamés dans le mois choisi et le mois précédent, jusqu'à cette date."
                      : "Tous les impayés cumulés jusqu'à la date choisie, sans limite d'historique."}
                </p>
              </div>

              {/* Quick shortcuts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPresetAsOf("today")}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                    asOf === todayInput
                      ? "bg-navy-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Aujourd&apos;hui
                </button>
                <button
                  type="button"
                  onClick={() => setPresetAsOf("endOfMonth")}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Fin de mois
                </button>
                <button
                  type="button"
                  onClick={() => setPresetAsOf("tenthOfMonth")}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  10 du mois
                </button>
                <button
                  type="button"
                  onClick={() => setPresetAsOf("firstOfMonth")}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  1er du mois
                </button>
                {asOf && (
                  <button
                    type="button"
                    onClick={() => setPresetAsOf("clear")}
                    className="text-[11px] font-semibold text-brand-600 hover:underline px-1"
                  >
                    Sans limite
                  </button>
                )}
              </div>

              {/* Overdue checkbox */}
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-rose-50/80 p-2.5 border border-rose-100">
                <input
                  type="checkbox"
                  checked={onlyLate}
                  onChange={(e) => setOnlyLate(e.target.checked)}
                  className="h-4 w-4 rounded border-rose-300 accent-rose-600"
                />
                <span className="text-xs font-bold text-rose-800">
                  Afficher uniquement les factures en retard (jours &gt; 0)
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                <Calendar size={14} className="text-brand-600" />
                Période de facturation / d&apos;inscription
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted">Du</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={`${selectCls} w-full text-xs`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted">Au</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={`${selectCls} w-full text-xs`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Group Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <Layers size={14} className="text-brand-600" />
              Filtrer par Groupe
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className={`${selectCls} w-full text-xs font-medium`}
              aria-label="Filtrer par groupe"
            >
              <option value="">Tous les groupes (Toutes matières)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.specialtyName} · {g.name} ({g.levelName})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Search query filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
              <Search size={14} className="text-brand-600" />
              Recherche élève ou parent
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom, prénom, téléphone..."
                className={`${selectCls} w-full pl-8 text-xs`}
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* 4. Status filter where relevant */}
          {isInvoices && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                <CreditCard size={14} className="text-brand-600" />
                Statut de règlement
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${selectCls} w-full text-xs font-medium`}
              >
                <option value="">Tous les statuts</option>
                <option value="UNPAID">Non payées uniquement</option>
                <option value="PARTIAL">Partiellement payées</option>
                <option value="PAID">Payées (soldées)</option>
              </select>
            </div>
          )}

          {/* 5. Columns options for student tab */}
          {withCols && (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
              <p className="text-xs font-bold text-navy-950">Colonnes incluses dans le rapport :</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Check size={14} className="text-brand-600" /> {firstCol}
                </div>
                {COLS.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={cols[c.key]}
                      onChange={(e) => setCols((s) => ({ ...s, [c.key]: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded border-line accent-brand-600"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 6. Export Actions */}
          <div className="pt-2 border-t border-line space-y-2">
            <p className="text-xs font-bold text-navy-950">Générer & Télécharger :</p>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={href("pdf")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:shadow"
              >
                <FileText size={15} />
                <span>PDF Officiel</span>
              </a>

              <a
                href={href("xlsx")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-sm transition hover:shadow"
              >
                <FileSpreadsheet size={15} />
                <span>Excel (.xlsx)</span>
              </a>
            </div>
          </div>
        </Card>

        {/* Right Column: Live Executive Preview (7 cols) */}
        <Card className="p-5 lg:col-span-8 overflow-hidden border-line shadow-xs">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-900 text-white">
                  <BookOpen size={13} />
                </span>
                <h2 className="text-sm font-bold text-navy-950">{preview.title}</h2>
                <span className="text-xs font-semibold text-slate-400">· {schoolName}</span>
              </div>
              {preview.subtitle && <p className="mt-1 text-xs text-muted font-medium">{preview.subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
              {pending && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  <LoaderCircle size={12} className="animate-spin text-brand-600" /> Calcul en cours…
                </span>
              )}
              <span className="text-xs font-extrabold text-navy-900 bg-slate-100 px-2.5 py-1 rounded-md">
                {preview.total} ligne(s) trouvée(s)
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-lg border border-line bg-white" aria-busy={pending}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-navy-900 text-white font-semibold">
                  {preview.head.map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2.5 whitespace-nowrap text-[11px] font-bold ${
                        preview.money.includes(i) ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {preview.rows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`hover:bg-slate-50/80 transition-colors ${rowIdx % 2 ? "bg-slate-50/40" : ""}`}
                  >
                    {row.map((val, cellIdx) => {
                      const isMoney = preview.money.includes(cellIdx);
                      const headName = preview.head[cellIdx];
                      const valStr = String(val);

                      // Highlighting Status column
                      if (headName === "Statut") {
                        const isPaid = valStr === "Payé" || valStr === "Active" || valStr === "Soldé";
                        const isPartial = valStr === "Partiel";
                        const isUnpaidStatus = valStr === "Non payé" || valStr === "Arrêtée";
                        return (
                          <td key={cellIdx} className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPartial
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : isUnpaidStatus
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {valStr}
                            </span>
                          </td>
                        );
                      }

                      // Highlighting Delay column
                      if (headName === "Jours de retard" || headName === "Retard") {
                        const match = valStr.match(/^(\d+)\s*j/);
                        const days = match ? parseInt(match[1], 10) : 0;
                        const isCritical = days > 15;
                        const isLate = days > 0;

                        return (
                          <td key={cellIdx} className="px-3 py-2 whitespace-nowrap">
                            {isLate ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                  isCritical
                                    ? "bg-rose-600 text-white animate-pulse"
                                    : "bg-amber-500 text-white"
                                }`}
                              >
                                <AlertTriangle size={10} />
                                {valStr}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium text-[11px]">—</span>
                            )}
                          </td>
                        );
                      }

                      // Reste à Payer column: highlighted in bold red
                      if (headName === "Reste à Payer" || headName === "Reste") {
                        const num = Number(val);
                        return (
                          <td key={cellIdx} className="px-3 py-2 text-right whitespace-nowrap">
                            <span className={num > 0 ? "font-bold text-rose-600" : "font-medium text-slate-500"}>
                              {formatDH(num)}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={cellIdx}
                          className={`px-3 py-2 whitespace-nowrap text-slate-700 ${
                            isMoney ? "text-right font-medium" : "text-left"
                          } ${cellIdx === 0 ? "font-bold text-navy-950" : ""}`}
                        >
                          {isMoney ? formatDH(Number(val)) : valStr}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {!preview.rows.length && (
                  <tr>
                    <td
                      colSpan={Math.max(preview.head.length, 1)}
                      className="px-4 py-8 text-center text-sm font-medium text-muted"
                    >
                      Aucun enregistrement ne correspond aux filtres choisis.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Totals Summary Footer Row */}
              {stats && (stats.totalDue !== undefined || stats.totalPaid !== undefined || stats.totalRemaining !== undefined) && (
                <tfoot>
                  <tr className="border-t-2 border-navy-900 bg-slate-100 font-bold text-navy-950">
                    {preview.head.map((h, i) => {
                      if (i === 0) {
                        return (
                          <td key={h} className="px-3 py-2.5 text-xs font-extrabold">
                            TOTAL ({stats.totalCount})
                          </td>
                        );
                      }
                      if (h === "Total Dû" || h === "Dû" || h === "Mensualité") {
                        return (
                          <td key={h} className="px-3 py-2.5 text-right font-extrabold text-navy-950">
                            {formatDH(stats.totalDue ?? 0)}
                          </td>
                        );
                      }
                      if (h === "Total Payé" || h === "Payé" || h === "Montant") {
                        return (
                          <td key={h} className="px-3 py-2.5 text-right font-extrabold text-emerald-700">
                            {formatDH(stats.totalPaid ?? 0)}
                          </td>
                        );
                      }
                      if (h === "Reste à Payer" || h === "Reste") {
                        return (
                          <td key={h} className="px-3 py-2.5 text-right font-extrabold text-rose-700">
                            {formatDH(stats.totalRemaining ?? 0)}
                          </td>
                        );
                      }
                      return <td key={h} className="px-3 py-2.5" />;
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted px-1">
            <span>Affichage des {preview.rows.length} premiers résultats sur {preview.total} au total.</span>
            <span>Les exports PDF et Excel contiennent la totalité des données filtrées.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
