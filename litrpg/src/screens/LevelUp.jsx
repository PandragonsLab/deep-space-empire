export default function LevelUpScreen({ player, skillOptions, onSelectSkill }) {
  return (
    <div className="screen level-up-screen">
      <div className="center-box">
        <div className="level-up-header">
          <p className="level-up-label">Level Up</p>
          <h2 className="level-up-title">You have reached Level {player.level}</h2>
          <p className="level-up-sub">Your power grows. Choose a new skill:</p>
        </div>

        <div className="skill-options">
          {skillOptions.map((skill) => (
            <div
              key={skill.id}
              className="skill-option"
              onClick={() => onSelectSkill(skill)}
            >
              <div className="skill-option-name">{skill.name}</div>
              <div className="skill-option-desc">{skill.desc}</div>
              <button className="btn-skill">Learn This Skill</button>
            </div>
          ))}
          {skillOptions.length === 0 && (
            <p className="no-skills">You have mastered all available skills.</p>
          )}
        </div>

        {skillOptions.length === 0 && (
          <button className="btn-primary" onClick={() => onSelectSkill(null)}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
