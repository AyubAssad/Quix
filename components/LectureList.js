"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const [selectedLectureId, setSelectedLectureId] = useState("");

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

  const selectedLecture = useMemo(() => {
    return visibleLectures.find((lecture) => lecture.id === selectedLectureId) ?? null;
  }, [visibleLectures, selectedLectureId]);

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
        <h2 className="section-title">Select your lecture path</h2>
        <p className="muted">
          Choose your stage, then block, then module from the dropdowns below.
        </p>
        <div className="grid">
          <label className="field">
            <span>Stage</span>
            <select
              onChange={(event) => {
                setSelectedStage(event.target.value);
                setSelectedBlock("");
                setSelectedModule("");
                setSelectedLectureId("");
              }}
              value={selectedStage}
            >
              <option value="">Choose stage</option>
              {stageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Block</span>
            <select
              disabled={!selectedStage || blockOptions.length === 0}
              onChange={(event) => {
                setSelectedBlock(event.target.value);
                setSelectedModule("");
                setSelectedLectureId("");
              }}
              value={selectedBlock}
            >
              <option value="">
                {!selectedStage ? "Choose stage first" : "Choose block"}
              </option>
              {blockOptions.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Module</span>
            <select
              disabled={!selectedBlock || moduleOptions.length === 0}
              onChange={(event) => {
                setSelectedModule(event.target.value);
                setSelectedLectureId("");
              }}
              value={selectedModule}
            >
              <option value="">
                {!selectedBlock ? "Choose block first" : "Choose module"}
              </option>
              {moduleOptions.map((moduleName) => (
                <option key={moduleName} value={moduleName}>
                  {moduleName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedStage && blockOptions.length === 0 && (
          <p className="muted">No blocks yet in this stage.</p>
        )}
        {selectedBlock && moduleOptions.length === 0 && (
          <p className="muted">No modules yet in this block.</p>
        )}
      </div>

      {selectedModule && (
        <div className="card">
          <h2 className="section-title">Open a lecture</h2>
          <label className="field">
            <span>Lecture</span>
            <select
              disabled={visibleLectures.length === 0}
              onChange={(event) => setSelectedLectureId(event.target.value)}
              value={selectedLectureId}
            >
              <option value="">Choose lecture</option>
              {visibleLectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </label>

          {visibleLectures.length === 0 && (
            <p className="muted">No lectures were found in this module yet.</p>
          )}

          {selectedLecture && (
            <div className="panel">
              <h3>{selectedLecture.title}</h3>
              <p className="muted">
                {selectedLecture.description || "No description yet."}
              </p>
              <Link className="button" href={`/lectures/${selectedLecture.id}`}>
                Start quiz
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
