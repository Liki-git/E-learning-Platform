import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const emptyModule = () => ({ title: "Module 1", order: 1, lessons: [{ title: "Introduction", type: "video", order: 1, duration: 10 }] });

const CreateCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technology",
    level: "Beginner",
    price: 0,
    image: "",
    tags: "",
    modules: [emptyModule()],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/courses/${id}`).then(({ data }) => {
      const c = data.course;
      setForm({
        title: c.title,
        description: c.description,
        category: c.category,
        level: c.level,
        price: c.price,
        image: c.image,
        tags: (c.tags || []).join(", "),
        modules: c.modules?.length ? c.modules : [emptyModule()],
      });
    });
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (isEdit) await api.put(`/courses/${id}`, payload);
      else await api.post("/courses", payload);
      navigate("/instructor/courses");
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title={isEdit ? "Edit Course" : "Create Course"}>
      <form className="course-form" onSubmit={handleSubmit}>
        <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Description<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="course-form__row">
          <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label>Level
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </label>
          <label>Price (₹)<input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        </div>
        <div className="course-form__row">
          <label style={{ flex: 2 }}>
            Cover image URL
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label style={{ flex: 1 }}>
            Or upload cover image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="cover-image-file"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const { data } = await api.post("/uploads", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                  });
                  setForm((prev) => ({ ...prev, image: data.url }));
                } catch (err) {
                  alert("Upload failed: " + (err.response?.data?.message || err.message));
                }
              }}
            />
            <button
              type="button"
              className="btn btn--outline"
              style={{ width: "100%", height: "42px", marginTop: "4px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => document.getElementById("cover-image-file").click()}
            >
              Upload file
            </button>
          </label>
        </div>
        <label>Tags (comma separated)<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
        <h3>Modules & lessons</h3>
        {form.modules.map((mod, mi) => (
          <div key={mi} className="module-editor">
            <input value={mod.title} onChange={(e) => {
              const modules = [...form.modules];
              modules[mi].title = e.target.value;
              setForm({ ...form, modules });
            }} placeholder="Module title" />
            {mod.lessons.map((lesson, li) => (
              <div key={li} className="lesson-editor">
                <input value={lesson.title} onChange={(e) => {
                  const modules = [...form.modules];
                  modules[mi].lessons[li].title = e.target.value;
                  setForm({ ...form, modules });
                }} placeholder="Lesson title" />
                <select value={lesson.type} onChange={(e) => {
                  const modules = [...form.modules];
                  modules[mi].lessons[li].type = e.target.value;
                  setForm({ ...form, modules });
                }}>
                  <option value="video">Video</option><option value="pdf">PDF</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option>
                </select>
              </div>
            ))}
            <button type="button" className="btn btn--outline btn--sm" onClick={() => {
              const modules = [...form.modules];
              modules[mi].lessons.push({ title: "New lesson", type: "video", order: mod.lessons.length + 1, duration: 10 });
              setForm({ ...form, modules });
            }}>+ Add lesson</button>
          </div>
        ))}
        <button type="button" className="btn btn--outline" onClick={() => setForm({ ...form, modules: [...form.modules, { title: `Module ${form.modules.length + 1}`, order: form.modules.length + 1, lessons: [] }] })}>+ Add module</button>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? "Saving..." : "Save course"}</button>
      </form>
    </DashboardLayout>
  );
};

export default CreateCourse;
