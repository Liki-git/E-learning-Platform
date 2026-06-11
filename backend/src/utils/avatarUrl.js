const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Instructor")}&background=2e7d32&color=fff&size=128`;

module.exports = avatarUrl;
