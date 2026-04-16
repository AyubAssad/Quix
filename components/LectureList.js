"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  const isPastPaper = activeSection === "past_paper";
  const currentStageOptions = isPastPaper ? [] : stageOptions;
  const currentBlockOptions = isPastPaper ? [] : blockOptions;
  const currentModuleOptions = isPastPaper ? [] : moduleOptions;
  const currentVisibleLectures = isPastPaper ? [] : visibleLectures;
  const currentSelectedLecture = isPastPaper ? null : selectedLecture;

  if (loading) {
    return <div className="panel">Loading lectures...</div>;
  }

  if (activeSection === "quizzes" && stageOptions.length === 0) {
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
        <h2 className="section-title">Choose your section</h2>
        <p className="muted">
          Open quizzes for your normal lecture quizzes, or switch to past paper for the same path layout.
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
          {isPastPaper
            ? "Past paper uses the same structure, but no past paper data has been added yet."
            : "Choose your stage, then block, then module from the dropdowns below."}
        </p>
        <div className="grid">
          <label className="field">
            <span>Stage</span>
            <select
              disabled={isPastPaper || currentStageOptions.length === 0}
              onChange={(event) => {
                setSelectedStage(event.target.value);
                setSelectedBlock("");
                setSelectedModule("");
                setSelectedLectureId("");
              }}
              value={selectedStage}
            >
              <option value="">{isPastPaper ? "No stage yet" : "Choose stage"}</option>
              {currentStageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Block</span>
            <select
              disabled={isPastPaper || !selectedStage || currentBlockOptions.length === 0}
              onChange={(event) => {
                setSelectedBlock(event.target.value);
                setSelectedModule("");
                setSelectedLectureId("");
              }}
              value={selectedBlock}
            >
              <option value="">
                {isPastPaper
                  ? "No block yet"
                  : !selectedStage
                    ? "Choose stage first"
                    : "Choose block"}
              </option>
              {currentBlockOptions.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Module</span>
            <select
              disabled={isPastPaper || !selectedBlock || currentModuleOptions.length === 0}
              onChange={(event) => {
                setSelectedModule(event.target.value);
                setSelectedLectureId("");
              }}
              value={selectedModule}
            >
              <option value="">
                {isPastPaper
                  ? "No module yet"
                  : !selectedBlock
                    ? "Choose block first"
                    : "Choose module"}
              </option>
              {currentModuleOptions.map((moduleName) => (
                <option key={moduleName} value={moduleName}>
                  {moduleName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!isPastPaper && selectedStage && currentBlockOptions.length === 0 && (
          <p className="muted">No blocks yet in this stage.</p>
        )}
        {!isPastPaper && selectedBlock && currentModuleOptions.length === 0 && (
          <p className="muted">No modules yet in this block.</p>
        )}
        {isPastPaper && (
          <p className="muted">Past paper is ready as a section, but no data has been added yet.</p>
        )}
      </div>

      {selectedModule && !isPastPaper && (
        <div className="card">
          <h2 className="section-title">Open a lecture</h2>
          <label className="field">
            <span>Lecture</span>
            <select
              disabled={currentVisibleLectures.length === 0}
              onChange={(event) => setSelectedLectureId(event.target.value)}
              value={selectedLectureId}
            >
              <option value="">Choose lecture</option>
              {currentVisibleLectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </label>

          {currentVisibleLectures.length === 0 && (
            <p className="muted">No lectures were found in this module yet.</p>
          )}

          {currentSelectedLecture && (
            <div className="panel">
              <h3>{currentSelectedLecture.title}</h3>
              <p className="muted">
                {currentSelectedLecture.description || "No description yet."}
              </p>
              <Link className="button" href={`/lectures/${currentSelectedLecture.id}`}>
                Start quiz
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
