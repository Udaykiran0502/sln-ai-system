name: Feature Request
description: Propose a new feature, canvas tool, or system capability
labels: ["enhancement", "feature-request"]
body:
  - type: textarea
    id: feature-description
    attributes:
      label: Feature Description
      description: A clear and concise description of what you want to happen.
      placeholder: I would like the system to...
    validations:
      required: true
  - type: textarea
    id: problem-solved
    attributes:
      label: Problem Statement
      description: What problem or creative bottleneck does this solve?
      placeholder: It is currently difficult to...
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternative Solutions
      description: Any alternative solutions or workarounds you've considered.
      placeholder: We could instead...
