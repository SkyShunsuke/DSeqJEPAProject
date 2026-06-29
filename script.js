const resultPanels = {
  classification: {
    title: "ImageNet and Fine-Grained Transfer",
    subtitle: "Top-1 accuracy using ViT-H/16 at 448px, comparing I-JEPA and DSeq-JEPA.",
    unit: "Top-1 accuracy",
    min: 38,
    max: 90,
    series: ["I-JEPA", "DSeq-JEPA"],
    colors: ["#8aa3ad", "#008b76"],
    groups: [
      { label: "ImageNet Linear", values: [81.1, 82.4] },
      { label: "Fine-tune", values: [87.1, 87.8] },
      { label: "iNat21", values: [38.9, 39.3] },
      { label: "CUB", values: [67.2, 68.9] },
      { label: "Cars", values: [67.7, 70.1] },
      { label: "Overall Avg.", values: [68.4, 69.7] },
    ],
    notes: [
      "ImageNet linear probing improves from 81.1 to 82.4.",
      "Fine-grained gains average +1.5 across iNat21, CUB, and Cars.",
      "Overall average improves from 68.4 to 69.7 with ViT-H/16 at 448px.",
    ],
  },
  dense: {
    title: "Dense Prediction Transfer",
    subtitle: "MS-COCO and ADE20K transfer with ViT-B/16 features.",
    unit: "AP / mIoU",
    min: 43,
    max: 52,
    series: ["I-JEPA", "DSeq-JEPA", "DSeq + Contrastive"],
    colors: ["#8aa3ad", "#008b76", "#3158ff"],
    groups: [
      { label: "AP box", values: [49.9, 50.5, 50.9] },
      { label: "AP mask", values: [44.5, 45.0, 45.7] },
      { label: "ADE mIoU", values: [47.6, 48.1, 48.9] },
    ],
    notes: [
      "DSeq-JEPA improves I-JEPA by +0.6 AP box and +0.5 AP mask.",
      "DSeq + Contrastive reaches 48.9 mIoU on ADE20K.",
      "The sequential pre-training signal transfers beyond classification.",
    ],
  },
  ablation: {
    title: "Prediction Order Ablation",
    subtitle: "ImageNet linear probing with ViT-B/16 under different order schemes.",
    unit: "Top-1 accuracy",
    min: 70,
    max: 74,
    series: ["ImageNet"],
    colors: ["#e94c3d"],
    groups: [
      { label: "Flat", values: [72.0] },
      { label: "Random", values: [71.7] },
      { label: "Spatial", values: [72.7] },
      { label: "Inverse", values: [71.3] },
      { label: "Truncate", values: [73.0] },
      { label: "DSeq", values: [73.5] },
    ],
    notes: [
      "Random and inverse ordering harm performance.",
      "Spatial order helps, but only mildly.",
      "Discriminative order reaches the best accuracy at 73.5.",
    ],
  },
  efficiency: {
    title: "Pre-training Overhead, Inference Efficiency",
    subtitle: "ViT-B/16 costs under the same ImageNet setup.",
    unit: "Cost",
    min: 0,
    max: 120,
    series: ["I-JEPA", "DSeq-JEPA"],
    colors: ["#8aa3ad", "#008b76"],
    groups: [
      { label: "Time (h)", values: [24.2, 26.5] },
      { label: "Memory (GB)", values: [31.5, 38.2] },
      { label: "Train GFLOPs", values: [96.4, 111.6] },
      { label: "Infer GFLOPs", values: [17.7, 17.8] },
    ],
    notes: [
      "The added computation is confined to pre-training.",
      "Inference remains essentially unchanged: 86.6M parameters.",
      "DSeq-JEPA uses 17.8 GFLOPs/image versus 17.7 for I-JEPA.",
    ],
  },
};

function removeAlphaXivButtons() {
  const candidates = document.querySelectorAll("a, button, [role='button']");
  candidates.forEach((node) => {
    const text = node.textContent || "";
    const href = node.getAttribute("href") || "";
    const label = node.getAttribute("aria-label") || "";
    if (/alphaxiv/i.test(`${text} ${href} ${label}`)) {
      node.remove();
    }
  });
}

removeAlphaXivButtons();

new MutationObserver(removeAlphaXivButtons).observe(document.body, {
  childList: true,
  subtree: true,
});

function makeSvg(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function appendText(svg, text, attrs = {}) {
  const node = makeSvg("text", attrs);
  node.textContent = text;
  svg.appendChild(node);
  return node;
}

function drawGroupedChart(panel) {
  const svg = document.getElementById("resultChart");
  if (!svg) {
    return;
  }

  const width = 920;
  const height = 420;
  const margin = { top: 28, right: 30, bottom: 86, left: 58 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const yMin = panel.min;
  const yMax = panel.max;
  const yToPx = (value) =>
    margin.top + chartH - ((value - yMin) / (yMax - yMin)) * chartH;

  svg.innerHTML = "";

  const tickCount = 5;
  for (let i = 0; i <= tickCount; i += 1) {
    const value = yMin + ((yMax - yMin) / tickCount) * i;
    const y = yToPx(value);
    svg.appendChild(
      makeSvg("line", {
        x1: margin.left,
        y1: y,
        x2: margin.left + chartW,
        y2: y,
        stroke: "rgba(66, 80, 91, 0.16)",
        "stroke-width": 1,
      })
    );
    appendText(svg, value.toFixed(value % 1 === 0 ? 0 : 1), {
      x: margin.left - 10,
      y: y + 4,
      "text-anchor": "end",
      "font-size": 12,
      "font-family": "Inter, sans-serif",
      fill: "#667480",
    });
  }

  const groupStep = chartW / panel.groups.length;
  const groupBarSpace = Math.min(92, groupStep * 0.7);
  const barGap = 6;
  const barW =
    (groupBarSpace - barGap * Math.max(0, panel.series.length - 1)) /
    panel.series.length;

  panel.groups.forEach((group, groupIndex) => {
    const groupCenter = margin.left + groupStep * groupIndex + groupStep / 2;
    const firstBarX = groupCenter - groupBarSpace / 2;

    group.values.forEach((value, seriesIndex) => {
      const x = firstBarX + seriesIndex * (barW + barGap);
      const y = yToPx(value);
      const h = margin.top + chartH - y;
      const isBest = value === Math.max(...group.values);
      const color = panel.colors[seriesIndex] || "#3158ff";

      svg.appendChild(
        makeSvg("rect", {
          x,
          y,
          width: barW,
          height: Math.max(2, h),
          rx: 5,
          fill: color,
          opacity: isBest ? 1 : 0.72,
        })
      );

      appendText(svg, value.toFixed(1), {
        x: x + barW / 2,
        y: y - 8,
        "text-anchor": "middle",
        "font-size": 12,
        "font-weight": isBest ? 800 : 600,
        "font-family": "Inter, sans-serif",
        fill: isBest ? "#111417" : "#667480",
      });
    });

    appendText(svg, group.label, {
      x: groupCenter,
      y: margin.top + chartH + 28,
      "text-anchor": "middle",
      "font-size": 12,
      "font-weight": 700,
      "font-family": "Inter, sans-serif",
      fill: "#42505b",
    });
  });

  svg.appendChild(
    makeSvg("line", {
      x1: margin.left,
      y1: margin.top + chartH,
      x2: margin.left + chartW,
      y2: margin.top + chartH,
      stroke: "#a9c2c7",
      "stroke-width": 1.2,
    })
  );

  let legendX = margin.left;
  panel.series.forEach((name, index) => {
    svg.appendChild(
      makeSvg("rect", {
        x: legendX,
        y: height - 28,
        width: 12,
        height: 12,
        rx: 3,
        fill: panel.colors[index] || "#3158ff",
      })
    );
    const text = appendText(svg, name, {
      x: legendX + 18,
      y: height - 18,
      "font-size": 12,
      "font-weight": 800,
      "font-family": "Inter, sans-serif",
      fill: "#42505b",
    });
    legendX += 24 + Math.max(72, name.length * 7.4);
    text.dataset.legend = name;
  });
}

function setResultPanel(key) {
  const panel = resultPanels[key];
  if (!panel) {
    return;
  }

  document.getElementById("chartTitle").textContent = panel.title;
  document.getElementById("chartSubtitle").textContent = panel.subtitle;
  document.getElementById("chartUnit").textContent = panel.unit;

  const notes = document.getElementById("resultNotes");
  notes.innerHTML = "<h3>Highlights</h3>";
  const list = document.createElement("ul");
  panel.notes.forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note;
    list.appendChild(item);
  });
  notes.appendChild(list);

  document.querySelectorAll(".result-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.result === key);
  });

  drawGroupedChart(panel);
}

document.querySelectorAll(".result-tab").forEach((button) => {
  button.addEventListener("click", () => setResultPanel(button.dataset.result));
});

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.13 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

const copyButton = document.getElementById("copyCitation");
const citation = document.getElementById("citationText");
if (copyButton && citation) {
  copyButton.addEventListener("click", async () => {
    const original = copyButton.textContent;
    try {
      await copyText(citation.innerText.trim());
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }
    window.setTimeout(() => {
      copyButton.textContent = original;
    }, 1400);
  });
}

const year = document.getElementById("currentYear");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

setResultPanel("classification");
