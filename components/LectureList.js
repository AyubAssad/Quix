"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Folder, Layers3 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LectureList() {
  const [stages, setStages] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [modules, setModules] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedModule, setSelectedModule] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const [
      { data: lectureData, error: lectureError },
      { data: stageData },
      { data: blockData },
      { data: moduleData }
    ] = await Promise.all([
      supabase
        .from("lectures")
        .select("id, stage, block, module_name, title, description")
        .order("created_at", { ascending: true }),
      supabase.from("stages").select("id, name").order("name", { ascending: true }),
      supabase
        .from("blocks")
        .select("id, stage_name, name")
        .order("stage_name", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("modules")
        .select("id, stage_name, block_name, name")
        .order("stage_name", { ascending: true })
        .order("block_name", { ascending: true })
        .order("name", { ascending: true })
    ]);

    if (!lectureError) {
      setLectures(lectureData ?? []);
    }

    setStages(stageData ?? []);
    setBlocks(blockData ?? []);
    setModules(moduleData ?? []);
    setLoading(false);
  }

  const stageOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...stages.map((stage) => stage.name).filter(Boolean),
        ...lectures.map((lecture) => lecture.stage).filter(Boolean)
      ])
    ).sort();
  }, [lectures, stages]);

  const blockOptions = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...blocks
            .filter((block) => block.stage_name === selectedStage)
            .map((block) => block.name)
            .filter(Boolean),
          ...lectures
            .filter((lecture) => lecture.stage === selectedStage)
            .map((lecture) => lecture.block)
            .filter(Boolean)
        ]
      )
    ).sort();
  }, [blocks, lectures, selectedStage]);

  const moduleOptions = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...modules
            .filter(
              (moduleItem) =>
                moduleItem.stage_name === selectedStage &&
                moduleItem.block_name === selectedBlock
            )
            .map((moduleItem) => moduleItem.name)
            .filter(Boolean),
          ...lectures
            .filter(
              (lecture) =>
                lecture.stage === selectedStage && lecture.block === selectedBlock
            )
            .map((lecture) => lecture.module_name)
            .filter(Boolean)
        ]
      )
    ).sort();
  }, [lectures, modules, selectedStage, selectedBlock]);

  const visibleLectures = useMemo(() => {
    return lectures.filter(
      (lecture) =>
        lecture.stage === selectedStage &&
        lecture.block === selectedBlock &&
        lecture.module_name === selectedModule
    );
  }, [lectures, selectedStage, selectedBlock, selectedModule]);

  if (loading) {
    return <div className="panel">Loading lectures...</div>;
  }

  if (stageOptions.length === 0) {
    return (
      <div className="panel">
        <p className="muted">
          {!supabase
            ? "Add your Supabase keys in .env.local first, then your stages will show here."
            : "No stages yet. Once the admin adds a stage, it will show here."}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <h2 className="section-title">1. Select stage</h2>
        <div className="grid">
          {stageOptions.map((stage) => (
            <button
              className={`folder-card ${selectedStage === stage ? "active" : ""}`}
              key={stage}
              onClick={() => {
                setSelectedStage(stage);
                setSelectedBlock("");
                setSelectedModule("");
              }}
              type="button"
            >
              <span className="folder-icon">
                <Layers3 size={16} />
              </span>
              <strong>{stage}</strong>
              <span className="muted">Open stage</span>
            </button>
          ))}
        </div>
      </div>

      {selectedStage && (
        <div className="card">
          <h2 className="section-title">2. Block</h2>
          {blockOptions.length === 0 && (
            <p className="muted">No blocks yet in this stage.</p>
          )}
          <div className="grid">
            {blockOptions.map((block) => (
              <button
                className={`folder-card ${selectedBlock === block ? "active" : ""}`}
                key={block}
                onClick={() => {
                  setSelectedBlock(block);
                  setSelectedModule("");
                }}
                type="button"
              >
                <span className="folder-icon">
                  <Folder size={16} />
                </span>
                <strong>{block}</strong>
                <span className="muted">Inside {selectedStage}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBlock && (
        <div className="card">
          <h2 className="section-title">3. Choose a module</h2>
          {moduleOptions.length === 0 && (
            <p className="muted">No modules yet in this block.</p>
          )}
          <div className="grid">
            {moduleOptions.map((moduleName) => (
              <button
                className={`folder-card ${selectedModule === moduleName ? "active" : ""}`}
                key={moduleName}
                onClick={() => setSelectedModule(moduleName)}
                type="button"
              >
                <span className="folder-icon">
                  <BookOpen size={16} />
                </span>
                <strong>{moduleName}</strong>
                <span className="muted">{selectedStage} / {selectedBlock}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedModule && (
        <div className="card">
          <h2 className="section-title">4. Open a lecture</h2>
          <div className="grid">
            {visibleLectures.map((lecture) => (
              <div className="panel" key={lecture.id}>
                <h3>{lecture.title}</h3>
                <p className="muted">{lecture.description || "No description yet."}</p>
                <Link className="button" href={`/lectures/${lecture.id}`}>
                  Start quiz
                </Link>
              </div>
            ))}
          </div>
          {visibleLectures.length === 0 && (
            <p className="muted">No lectures were found in this module yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
