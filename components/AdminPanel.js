"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const emptyLecture = {
  stage: "",
  block: "",
  module_name: "",
  title: "",
  description: ""
};

const emptyQuestion = {
  lecture_id: "",
  question_type: "mcq",
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "a"
};

export default function AdminPanel() {
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [adminView, setAdminView] = useState("lecture");
  const [stages, setStages] = useState([]);
  const [stageName, setStageName] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [blockForm, setBlockForm] = useState({ stage_name: "", name: "" });
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({
    stage_name: "",
    block_name: "",
    name: ""
  });
  const [lectures, setLectures] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [lectureForm, setLectureForm] = useState(emptyLecture);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [questionMode, setQuestionMode] = useState("single");
  const [bulkQuestionType, setBulkQuestionType] = useState("mcq");
  const [bulkQuestionsText, setBulkQuestionsText] = useState("");

  const stageOptions = useMemo(() => {
    const allStages = [
      ...stages.map((stage) => stage.name).filter(Boolean),
      ...lectures.map((lecture) => lecture.stage).filter(Boolean)
    ];

    return Array.from(new Set(allStages)).sort();
  }, [lectures, stages]);

  const blockOptions = useMemo(() => {
    const blockNames = [
      ...blocks
        .filter((block) => block.stage_name === lectureForm.stage)
        .map((block) => block.name)
        .filter(Boolean),
      ...lectures
        .filter((lecture) => lecture.stage === lectureForm.stage)
        .map((lecture) => lecture.block)
        .filter(Boolean)
    ];

    return Array.from(new Set(blockNames)).sort();
  }, [blocks, lectures, lectureForm.stage]);

  const moduleOptions = useMemo(() => {
    const moduleNames = [
      ...modules
        .filter(
          (moduleItem) =>
            moduleItem.stage_name === lectureForm.stage &&
            moduleItem.block_name === lectureForm.block
        )
        .map((moduleItem) => moduleItem.name)
        .filter(Boolean),
      ...lectures
        .filter(
          (lecture) =>
            lecture.stage === lectureForm.stage && lecture.block === lectureForm.block
        )
        .map((lecture) => lecture.module_name)
        .filter(Boolean)
    ];

    return Array.from(new Set(moduleNames)).sort();
  }, [lectures, modules, lectureForm.stage, lectureForm.block]);

  const moduleBlockOptions = useMemo(() => {
    const blockNames = [
      ...blocks
        .filter((block) => block.stage_name === moduleForm.stage_name)
        .map((block) => block.name)
        .filter(Boolean),
      ...lectures
        .filter((lecture) => lecture.stage === moduleForm.stage_name)
        .map((lecture) => lecture.block)
        .filter(Boolean)
    ];

    return Array.from(new Set(blockNames)).sort();
  }, [blocks, lectures, moduleForm.stage_name]);

  useEffect(() => {
    loadAdminPage();
  }, []);

  async function loadAdminPage() {
    if (!supabase) {
      setReady(true);
      return;
    }

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const isAdmin = user?.email === adminEmail;
    setAllowed(isAdmin);

    if (isAdmin) {
      await Promise.all([
        loadStages(),
        loadBlocks(),
        loadModules(),
        loadLectures(),
        loadQuestions()
      ]);
    }

    setReady(true);
  }

  async function loadStages() {
    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("stages")
      .select("id, name")
      .order("name", { ascending: true });

    setStages(data ?? []);
  }

  async function loadBlocks() {
    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("blocks")
      .select("id, stage_name, name")
      .order("stage_name", { ascending: true })
      .order("name", { ascending: true });

    setBlocks(data ?? []);
  }

  async function loadModules() {
    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("modules")
      .select("id, stage_name, block_name, name")
      .order("stage_name", { ascending: true })
      .order("block_name", { ascending: true })
      .order("name", { ascending: true });

    setModules(data ?? []);
  }

  async function loadLectures() {
    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("lectures")
      .select("id, stage, block, module_name, title, description")
      .order("created_at", { ascending: true });

    setLectures(data ?? []);
  }

  async function loadQuestions() {
    if (!supabase) {
      return;
    }

    const { data } = await supabase
      .from("questions")
      .select("id, lecture_id, question_type, question_text, correct_option, lectures(title)")
      .order("created_at", { ascending: true });

    setQuestions(data ?? []);
  }

  async function createStage(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    const trimmedName = stageName.trim();
    if (!trimmedName) {
      setStatus("Please enter a stage name.");
      return;
    }

    const { error } = await supabase.from("stages").insert({ name: trimmedName });
    if (error) {
      setStatus(error.message);
      return;
    }

    setStageName("");
    setStatus("Stage added.");
    loadStages();
  }

  async function createBlock(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    const payload = {
      stage_name: blockForm.stage_name,
      name: blockForm.name.trim()
    };

    if (!payload.stage_name || !payload.name) {
      setStatus("Please choose a stage and enter a block name.");
      return;
    }

    const { error } = await supabase.from("blocks").insert(payload);
    if (error) {
      setStatus(error.message);
      return;
    }

    setBlockForm({ stage_name: "", name: "" });
    setStatus("Block added.");
    loadBlocks();
  }

  async function createModule(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    const payload = {
      stage_name: moduleForm.stage_name,
      block_name: moduleForm.block_name,
      name: moduleForm.name.trim()
    };

    if (!payload.stage_name || !payload.block_name || !payload.name) {
      setStatus("Please choose the stage, block, and module name.");
      return;
    }

    const { error } = await supabase.from("modules").insert(payload);
    if (error) {
      setStatus(error.message);
      return;
    }

    setModuleForm({ stage_name: "", block_name: "", name: "" });
    setStatus("Module added.");
    loadModules();
  }

  async function createLecture(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    const lecturePayload = {
      stage: lectureForm.stage,
      block: lectureForm.block,
      module_name: lectureForm.module_name,
      title: lectureForm.title.trim(),
      description: lectureForm.description.trim() || null
    };

    if (!lecturePayload.stage || !lecturePayload.block || !lecturePayload.module_name) {
      setStatus("Please choose the stage, block, and module before saving.");
      return;
    }

    const { error } = await supabase.from("lectures").insert(lecturePayload);
    if (error) {
      setStatus(error.message);
      return;
    }

    setLectureForm(emptyLecture);
    setStatus("Lecture added.");
    loadLectures();
  }

  async function createQuestion(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    const isTrueFalse = questionForm.question_type === "true_false";
    const payload = {
      lecture_id: questionForm.lecture_id,
      question_type: questionForm.question_type,
      question_text: questionForm.question_text.trim(),
      option_a: isTrueFalse ? "True" : questionForm.option_a.trim(),
      option_b: isTrueFalse ? "False" : questionForm.option_b.trim(),
      option_c: isTrueFalse ? null : questionForm.option_c.trim() || null,
      option_d: isTrueFalse ? null : questionForm.option_d.trim() || null,
      correct_option: questionForm.correct_option,
      points: 1
    };

    if (!payload.lecture_id || !payload.question_text || !payload.option_a || !payload.option_b) {
      setStatus("Please fill in the question and the required answer options.");
      return;
    }

    if (!isTrueFalse && (!questionForm.option_c.trim() || !questionForm.option_d.trim())) {
      setStatus("MCQ questions need four answer options.");
      return;
    }

    const { error } = await supabase.from("questions").insert(payload);
    if (error) {
      setStatus(error.message);
      return;
    }

    setQuestionForm((current) => ({
      ...emptyQuestion,
      lecture_id: current.lecture_id
    }));
    setStatus("Question added. You can keep adding more questions for this lecture.");
    loadQuestions();
  }

  async function createBulkQuestions(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    if (!questionForm.lecture_id) {
      setStatus("Please choose a lecture first.");
      return;
    }

    const blocks = bulkQuestionsText
      .split(/\n\s*\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      setStatus("Paste at least one question in the bulk box.");
      return;
    }

    const payload = [];

    for (const block of blocks) {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (bulkQuestionType === "mcq") {
        if (lines.length < 6) {
          setStatus(
            "Each MCQ block must have 6 lines: question, option A, option B, option C, option D, correct letter."
          );
          return;
        }

        const correctOption = lines[5].toLowerCase();
        if (!["a", "b", "c", "d"].includes(correctOption)) {
          setStatus("Each MCQ correct answer must be one of: a, b, c, d.");
          return;
        }

        payload.push({
          lecture_id: questionForm.lecture_id,
          question_type: "mcq",
          question_text: lines[0],
          option_a: lines[1],
          option_b: lines[2],
          option_c: lines[3],
          option_d: lines[4],
          correct_option: correctOption,
          points: 1
        });
      } else {
        if (lines.length < 2) {
          setStatus(
            "Each True/False block must have 2 lines: question, then correct answer (true or false)."
          );
          return;
        }

        const correctValue = lines[1].toLowerCase();
        if (!["true", "false"].includes(correctValue)) {
          setStatus("Each True/False answer must be true or false.");
          return;
        }

        payload.push({
          lecture_id: questionForm.lecture_id,
          question_type: "true_false",
          question_text: lines[0],
          option_a: "True",
          option_b: "False",
          option_c: null,
          option_d: null,
          correct_option: correctValue === "true" ? "a" : "b",
          points: 1
        });
      }
    }

    const { error } = await supabase.from("questions").insert(payload);
    if (error) {
      setStatus(error.message);
      return;
    }

    setBulkQuestionsText("");
    setStatus(`${payload.length} questions added successfully.`);
    loadQuestions();
  }

  async function deleteItem(table, id, successMessage) {
    setStatus("");

    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus(successMessage);

    if (table === "stages") {
      loadStages();
    }
    if (table === "blocks") {
      loadBlocks();
    }
    if (table === "modules") {
      loadModules();
    }
    if (table === "lectures") {
      loadLectures();
      loadQuestions();
    }
    if (table === "questions") {
      loadQuestions();
    }
  }

  if (!ready) {
    return <div className="panel">Checking admin access...</div>;
  }

  if (!allowed) {
    return (
      <div className="card">
        <h1 className="section-title">Admin only</h1>
        <p className="muted">
          {!supabase
            ? "Add your Supabase URL and anon key in .env.local first."
            : "This page only works when you login with the email set in `NEXT_PUBLIC_ADMIN_EMAIL`."}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      {status && <div className="message">{status}</div>}

      <div className="card">
        <h2 className="section-title">Admin options</h2>
        <div className="nav-links">
          <button
            className={`button ${adminView === "lecture" ? "" : "secondary"}`}
            onClick={() => setAdminView("lecture")}
            type="button"
          >
            Add lecture
          </button>
          <button
            className={`button ${adminView === "question" ? "" : "secondary"}`}
            onClick={() => setAdminView("question")}
            type="button"
          >
            Add question
          </button>
          <button
            className={`button ${adminView === "module" ? "" : "secondary"}`}
            onClick={() => setAdminView("module")}
            type="button"
          >
            Add module
          </button>
          <button
            className={`button ${adminView === "block" ? "" : "secondary"}`}
            onClick={() => setAdminView("block")}
            type="button"
          >
            Add block
          </button>
          <button
            className={`button ${adminView === "stage" ? "" : "secondary"}`}
            onClick={() => setAdminView("stage")}
            type="button"
          >
            Add stage
          </button>
        </div>
      </div>

      {adminView === "stage" && (
        <div className="stack">
          <form className="card stack" onSubmit={createStage}>
            <h2 className="section-title">Add stage</h2>
            <label className="field">
              <span>Stage name</span>
              <input
                required
                value={stageName}
                onChange={(event) => setStageName(event.target.value)}
                placeholder="Stage 1"
              />
            </label>
            <button className="button" type="submit">
              Save stage
            </button>
          </form>

          <div className="card stack">
            <h2 className="section-title">Existing stages</h2>
            {stages.length === 0 && <p className="muted">No stages yet.</p>}
            {stages.map((stage) => (
              <div className="panel action-row" key={stage.id}>
                <strong>{stage.name}</strong>
                <button
                  className="button danger"
                  onClick={() => deleteItem("stages", stage.id, "Stage deleted.")}
                  type="button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminView === "block" && (
        <div className="stack">
          <form className="card stack" onSubmit={createBlock}>
            <h2 className="section-title">Add block</h2>
            <label className="field">
              <span>Stage</span>
              <select
                required
                value={blockForm.stage_name}
                onChange={(event) =>
                  setBlockForm((current) => ({ ...current, stage_name: event.target.value }))
                }
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
              <span>Block name</span>
              <input
                required
                value={blockForm.name}
                onChange={(event) =>
                  setBlockForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Block A"
              />
            </label>
            <button className="button" type="submit">
              Save block
            </button>
          </form>

          <div className="card stack">
            <h2 className="section-title">Existing blocks</h2>
            {blocks.length === 0 && <p className="muted">No blocks yet.</p>}
            {blocks.map((block) => (
              <div className="panel action-row" key={block.id}>
                <div>
                  <strong>{block.name}</strong>
                  <p className="muted">{block.stage_name}</p>
                </div>
                <button
                  className="button danger"
                  onClick={() => deleteItem("blocks", block.id, "Block deleted.")}
                  type="button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminView === "module" && (
        <div className="stack">
        <form className="card stack" onSubmit={createModule}>
          <h2 className="section-title">Add module</h2>
          <label className="field">
            <span>Stage</span>
            <select
              required
              value={moduleForm.stage_name}
              onChange={(event) =>
                setModuleForm({
                  stage_name: event.target.value,
                  block_name: "",
                  name: ""
                })
              }
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
              disabled={!moduleForm.stage_name}
              required
              value={moduleForm.block_name}
              onChange={(event) =>
                setModuleForm((current) => ({ ...current, block_name: event.target.value }))
              }
            >
              <option value="">Choose block</option>
              {moduleBlockOptions.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Module name</span>
            <input
              required
              value={moduleForm.name}
              onChange={(event) =>
                setModuleForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Module 1"
            />
          </label>
          <button className="button" type="submit">
            Save module
          </button>
        </form>
        <div className="card stack">
          <h2 className="section-title">Existing modules</h2>
          {modules.length === 0 && <p className="muted">No modules yet.</p>}
          {modules.map((moduleItem) => (
            <div className="panel action-row" key={moduleItem.id}>
              <div>
                <strong>{moduleItem.name}</strong>
                <p className="muted">
                  {moduleItem.stage_name} / {moduleItem.block_name}
                </p>
              </div>
              <button
                className="button danger"
                onClick={() => deleteItem("modules", moduleItem.id, "Module deleted.")}
                type="button"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        </div>
      )}

      {adminView === "lecture" && (
        <div className="stack">
        <form className="card stack" onSubmit={createLecture}>
          <h2 className="section-title">Add lecture</h2>
          <label className="field">
            <span>Stage</span>
            <select
              required
              value={lectureForm.stage}
              onChange={(event) =>
                setLectureForm((current) => ({
                  ...current,
                  stage: event.target.value,
                  block: "",
                  module_name: ""
                }))
              }
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
              disabled={!lectureForm.stage}
              required
              value={lectureForm.block}
              onChange={(event) =>
                setLectureForm((current) => ({
                  ...current,
                  block: event.target.value,
                  module_name: ""
                }))
              }
            >
              <option value="">Choose block</option>
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
              disabled={!lectureForm.block}
              required
              value={lectureForm.module_name}
              onChange={(event) =>
                setLectureForm((current) => ({
                  ...current,
                  module_name: event.target.value
                }))
              }
            >
              <option value="">Choose module</option>
              {moduleOptions.map((moduleName) => (
                <option key={moduleName} value={moduleName}>
                  {moduleName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Lecture title</span>
            <input
              required
              value={lectureForm.title}
              onChange={(event) =>
                setLectureForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Description (Optional)</span>
            <textarea
              rows="4"
              value={lectureForm.description}
              onChange={(event) =>
                setLectureForm((current) => ({
                  ...current,
                  description: event.target.value
                }))
              }
            />
          </label>
          <button className="button" type="submit">
            Save lecture
          </button>
        </form>
        <div className="card stack">
          <h2 className="section-title">Existing lectures</h2>
          {lectures.length === 0 && <p className="muted">No lectures yet.</p>}
          {lectures.map((lecture) => (
            <div className="panel action-row" key={lecture.id}>
              <div>
                <strong>{lecture.title}</strong>
                <p className="muted">
                  {[lecture.stage, lecture.block, lecture.module_name].filter(Boolean).join(" / ")}
                </p>
              </div>
              <button
                className="button danger"
                onClick={() => deleteItem("lectures", lecture.id, "Lecture deleted.")}
                type="button"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        </div>
      )}

      {adminView === "question" && (
        <div className="stack">
        <form className="card stack" onSubmit={createQuestion}>
          <h2 className="section-title">Add question</h2>
          <div className="nav-links">
            <button
              className={`button ${questionMode === "single" ? "" : "secondary"}`}
              onClick={() => setQuestionMode("single")}
              type="button"
            >
              Single
            </button>
            <button
              className={`button ${questionMode === "bulk" ? "" : "secondary"}`}
              onClick={() => setQuestionMode("bulk")}
              type="button"
            >
              Bulk
            </button>
          </div>
          <label className="field">
            <span>Lecture</span>
            <select
              required
              value={questionForm.lecture_id}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  lecture_id: event.target.value
                }))
              }
            >
              <option value="">Choose a lecture</option>
              {lectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {[lecture.stage, lecture.block, lecture.module_name, lecture.title]
                    .filter(Boolean)
                    .join(" / ")}
                </option>
              ))}
            </select>
          </label>
          {questionMode === "single" && (
            <>
          <label className="field">
            <span>Question type</span>
            <select
              value={questionForm.question_type}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  question_type: event.target.value,
                  option_a: "",
                  option_b: "",
                  option_c: "",
                  option_d: "",
                  correct_option: "a"
                }))
              }
            >
              <option value="mcq">MCQ</option>
              <option value="true_false">True / False</option>
            </select>
          </label>
          <label className="field">
            <span>Question</span>
            <textarea
              required
              rows="3"
              value={questionForm.question_text}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  question_text: event.target.value
                }))
              }
            />
          </label>

          {questionForm.question_type === "mcq" && (
            <>
              <label className="field">
                <span>Option A</span>
                <input
                  required
                  value={questionForm.option_a}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      option_a: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Option B</span>
                <input
                  required
                  value={questionForm.option_b}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      option_b: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Option C</span>
                <input
                  required
                  value={questionForm.option_c}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      option_c: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Option D</span>
                <input
                  required
                  value={questionForm.option_d}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      option_d: event.target.value
                    }))
                  }
                />
              </label>
            </>
          )}

          {questionForm.question_type === "true_false" && (
            <div className="message">This question will use the answers: True and False.</div>
          )}

          <label className="field">
            <span>Correct answer</span>
            <select
              value={questionForm.correct_option}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  correct_option: event.target.value
                }))
              }
            >
              <option value="a">
                {questionForm.question_type === "true_false" ? "True" : "Option A"}
              </option>
              <option value="b">
                {questionForm.question_type === "true_false" ? "False" : "Option B"}
              </option>
              {questionForm.question_type === "mcq" && <option value="c">Option C</option>}
              {questionForm.question_type === "mcq" && <option value="d">Option D</option>}
            </select>
          </label>

          <div className="message">Each question is worth 1 point.</div>

          <button className="button" type="submit">
            Save question
          </button>
            </>
          )}
          {questionMode === "bulk" && (
            <>
              <label className="field">
                <span>Bulk question type</span>
                <select
                  value={bulkQuestionType}
                  onChange={(event) => setBulkQuestionType(event.target.value)}
                >
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True / False</option>
                </select>
              </label>
              <label className="field">
                <span>Bulk questions</span>
                <textarea
                  rows="14"
                  value={bulkQuestionsText}
                  onChange={(event) => setBulkQuestionsText(event.target.value)}
                  placeholder={
                    bulkQuestionType === "mcq"
                      ? "Question 1\nOption A\nOption B\nOption C\nOption D\na\n\nQuestion 2\nOption A\nOption B\nOption C\nOption D\nc"
                      : "The heart pumps blood.\ntrue\n\nThe liver is in the leg.\nfalse"
                  }
                />
              </label>
              <div className="message">
                {bulkQuestionType === "mcq"
                  ? "MCQ format: question, option A, option B, option C, option D, correct answer letter. Leave one empty line between questions."
                  : "True/False format: question, then true or false. Leave one empty line between questions."}
              </div>
              <button className="button" onClick={createBulkQuestions} type="button">
                Save bulk questions
              </button>
            </>
          )}
        </form>
        <div className="card stack">
          <h2 className="section-title">Existing questions</h2>
          {questions.length === 0 && <p className="muted">No questions yet.</p>}
          {questions.map((question) => (
            <div className="panel action-row" key={question.id}>
              <div>
                <strong>{question.question_text}</strong>
                <p className="muted">
                  {(question.lectures && question.lectures.title) || "Lecture"} / {question.question_type}
                </p>
              </div>
              <button
                className="button danger"
                onClick={() => deleteItem("questions", question.id, "Question deleted.")}
                type="button"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
