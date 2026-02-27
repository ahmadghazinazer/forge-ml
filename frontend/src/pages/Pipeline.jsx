// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

export default function Pipeline() {
    return (
        <div>
            <div className="page-header">
                <h2>Training Pipeline</h2>
                <p className="subtitle">End-to-end post-training workflow from data ingestion to deployment</p>
            </div>

            <div className="pipeline-container">
                <PipelineNode
                    icon="1"
                    title="Data Ingestion"
                    desc="Upload and parse datasets from S3, GCS, or local storage"
                    color="var(--blue)"
                />
                <Arrow />
                <PipelineNode
                    icon="2"
                    title="Versioning & Governance"
                    desc="Track lineage, enforce PII policies, validate licensing metadata"
                    color="var(--cyan)"
                />
                <Arrow />
                <PipelineNode
                    icon="3"
                    title="Training Orchestration"
                    desc="Launch LoRA SFT, DPO, or RLHF runs with reproducible configs"
                    color="var(--indigo)"
                />
                <Arrow />
                <PipelineNode
                    icon="4"
                    title="Distributed Runtime"
                    desc="Multi-GPU execution with failure detection and auto-retry"
                    color="var(--purple)"
                />
                <Arrow />
                <PipelineNode
                    icon="5"
                    title="Model Registry"
                    desc="Register artifacts, enforce eval gates, manage promotion stages"
                    color="var(--green)"
                />
                <Arrow />
                <PipelineNode
                    icon="6"
                    title="Evaluation & Red-Teaming"
                    desc="Offline benchmarks, safety evals, regression testing"
                    color="var(--amber)"
                />
                <Arrow />
                <PipelineNode
                    icon="7"
                    title="Deployment"
                    desc="Promote to production with rollback support and audit logs"
                    color="var(--teal)"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }}>
                <div className="glass-card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                        Supported Recipes
                    </h3>
                    <RecipeRow name="LoRA SFT" desc="Parameter-efficient supervised fine-tuning via low-rank adapters" tags={['PEFT', 'Transformers']} />
                    <RecipeRow name="DPO" desc="Direct Preference Optimization alignment using paired preference data" tags={['TRL', 'Alignment']} />
                    <RecipeRow name="RLHF" desc="PPO-based reinforcement learning from human feedback with reward models" tags={['TRL', 'PPO']} />
                </div>

                <div className="glass-card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                        Evaluation Suites
                    </h3>
                    <SuiteRow name="Default" benchmarks={['accuracy', 'perplexity', 'toxicity', 'coherence']} />
                    <SuiteRow name="Safety" benchmarks={['toxicity', 'bias', 'refusal_rate', 'jailbreak_resistance']} />
                    <SuiteRow name="Quality" benchmarks={['fluency', 'coherence', 'relevance', 'accuracy']} />
                    <SuiteRow name="Reasoning" benchmarks={['math_accuracy', 'logic_score', 'code_correctness']} />
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                    Cluster Cost Optimizer
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7 }}>
                    The training orchestrator continuously monitors cluster health, GPU utilization, and failure rates.
                    When a node becomes degraded, running jobs are automatically rescheduled to healthy nodes.
                    Cost estimation accounts for GPU hours plus a 15% platform overhead, and the system prefers
                    spot-instance-compatible nodes before falling back to on-demand capacity. Failure detection
                    uses a three-strike policy: three consecutive heartbeat failures mark a node offline and
                    trigger automatic workload redistribution.
                </p>
            </div>
        </div>
    );
}

function PipelineNode({ icon, title, desc, color }) {
    return (
        <div className="pipeline-node">
            <div className="node-icon" style={{ background: `${color}20`, color }}>
                {icon}
            </div>
            <h4>{title}</h4>
            <p>{desc}</p>
        </div>
    );
}

function Arrow() {
    return <div className="pipeline-arrow">&rarr;</div>;
}

function RecipeRow({ name, desc, tags }) {
    return (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-bright)', marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 6 }}>{desc}</div>
            <div>{tags.map(t => <span className="tag recipe" key={t}>{t}</span>)}</div>
        </div>
    );
}

function SuiteRow({ name, benchmarks }) {
    return (
        <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-dim)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-bright)', marginBottom: 6 }}>{name}</div>
            <div>{benchmarks.map(b => <span className="tag" key={b}>{b}</span>)}</div>
        </div>
    );
}
