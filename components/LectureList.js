"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function normalizeContentType(value) {
  return value === "past_paper" ? "past_paper" : "quiz";
}

export default function LectureList() {
  const [activeSection, setActiveSection] = useState("quizzes");
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
        .select("id, content_type, stage, block, module_name, title, description")
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

  const currentContentType = activeSection === "past_paper" ? "past_paper" : "quiz";

  const filteredLectures = useMemo(() => {
    return lectures.filter(
      (lecture) => normalizeContentType(lecture.content_type) === currentContentType
    );
  }, [currentContentType, lectures]);

  const stageOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...stages.map((stage) => stage.name).filter(Boolean),
        ...filteredLectures.map((lecture) => lecture.stage).filter(Boolean)
      ])
    ).sort();
  }, [filteredLectures, stages]);

  const blockOptions = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...blocks
            .filter((block) => block.stage_name === selectedStage)
            .map((block) => block.name)
            .filter(Boolean),
          ...filteredLectures
            .filter((lecture) => lecture.stage === selectedStage)
            .map((lecture) => lecture.block)
            .filter(Boolean)
        ]
      )
    ).sort();
  }, [blocks, filteredLectures, selectedStage]);

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
          ...filteredLectures
            .filter(
              (lecture) =>
                lecture.stage === selectedStage && lecture.block === selectedBlock
            )
            .map((lecture) => lecture.module_name)
            .filter(Boolean)
        ]
      )
    ).sort();
  }, [filteredLectures, modules, selectedStage, selectedBlock]);

  const visibleLectures = useMemo(() => {
    return filteredLectures.filter(
      (lecture) =>
        lecture.stage === selectedStage &&
        lecture.block === selectedBlock &&
        lecture.module_name === selectedModule
    );
  }, [filteredLectures, selectedStage, selectedBlock, selectedModule]);

  const selectedLecture = useMemo(() => {
    return visibleLectures.find((lecture) => lecture.id === selectedLectureId) ?? null;
  }, [selectedLectureId, visibleLectures]);

  if (loading) {
    return <div className="panel">Loading content...</div>;
  }

  if (stageOptions.length === 0) {
    return (
      <div className="panel">
        <p className="muted">
          {!supabase
            ? "Add your Supabase keys in .env.local first, then your sections will show here."
            : activeSection === "past_paper"
              ? "No past paper path yet. Add a past paper from admin and it will show here."
              : "No quiz path yet. Once the admin adds a lecture, it will show here."}
        </p>
      </div>
    );
  }

  const isPastPaper = currentContentType === "past_paper";
  const itemLabel = isPastPaper ? "Past paper" : "Lecture";
  const actionLabel = isPastPaper ? "Start past paper" : "Start quiz";
  const itemHref = selectedLecture
    ? isPastPaper
      ? `/past-papers/${selectedLecture.id}`
      : `/lectures/${selectedLecture.id}`
    : "#";

  return (
    <div className="stack">
      <div className="card">
        <h2 className="section-title">Choose your section</h2>
        <p className="muted">
          Open quizzes for lecture practice, or switch to past paper and solve the same way through stage, block, and module.
        </p>
        <div className="nav-links">
          <button
            className={`button ${activeSection === "quizzes" ? "" : "secondary"}`}
            onClick={() => {
              setActiveSection("quizzes");
              setSelectedStage("");
              setSelectedBlock("");
              setSelectedModule("");
              setSelectedLectureId("");
            }}
            type="button"
          >
            Quizzes
          </button>
          <button
            className={`button ${activeSection === "past_paper" ? "" : "secondary"}`}
            onClick={() => {
              setActiveSection("past_paper");
              setSelectedStage("");
              setSelectedBlock("");
              setSelectedModule("");
              setSelectedLectureId("");
            }}
            type="button"
          >
            Past paper
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">
          {isPastPaper ? "Select your past paper path" : "Select your lecture path"}
        </h2>
        <p className="muted">
          Choose your stage, then block, then module from the dropdowns below.
        </p>
        <div className="grid">
          <label className="field">
            <span>Stage</span>
            <select
              disabled={stageOptions.length === 0}
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

      {selectedModule && !isPastPaper && (
        <div className="card">
          <h2 className="section-title">Open a {itemLabel.toLowerCase()}</h2>
          <label className="field">
            <span>{itemLabel}</span>
            <select
              disabled={visibleLectures.length === 0}
              onChange={(event) => setSelectedLectureId(event.target.value)}
              value={selectedLectureId}
            >
              <option value="">Choose {itemLabel.toLowerCase()}</option>
              {visibleLectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </label>

          {visibleLectures.length === 0 && (
            <p className="muted">
              {isPastPaper
                ? "No past papers were found in this module yet."
                : "No lectures were found in this module yet."}
            </p>
          )}

          {selectedLecture && (
            <div className="panel">
              <h3>{selectedLecture.title}</h3>
              <p className="muted">
                {selectedLecture.description || "No description yet."}
              </p>
              <Link className="button" href={itemHref}>
                {actionLabel}
              </Link>
            </div>
          )}
        </div>
      )}

      {selectedModule && isPastPaper && (
        <div className="card">
          <h2 className="section-title">Open a past paper</h2>
          <label className="field">
            <span>Past paper</span>
            <select
              disabled={visibleLectures.length === 0}
              onChange={(event) => setSelectedLectureId(event.target.value)}
              value={selectedLectureId}
            >
              <option value="">Choose past paper</option>
              {visibleLectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </label>

          {visibleLectures.length === 0 && (
            <p className="muted">No past papers were found in this module yet.</p>
          )}

          {selectedLecture && (
            <div className="panel">
              <h3>{selectedLecture.title}</h3>
              <p className="muted">
                {selectedLecture.description || "No description yet."}
              </p>
              <Link className="button" href={itemHref}>
                Start past paper
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
