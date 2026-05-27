name: Bug Report
description: Report a bug or rendering defect in the creative operating system
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!
  - type: textarea
    id: describe-bug
    attributes:
      label: Bug Description
      description: A clear and concise description of what the bug is.
      placeholder: Describe what happened...
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Open Workspace page
        2. Select layer NT-10
        3. Slide Rotation to 90 degrees
        4. See visual clipping
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Environment Info
      description: OS version, browser, workstation hardware specs.
      placeholder: e.g. Windows 11, Chrome 124, Intel i7, 16GB RAM, GT 730 GPU
    validations:
      required: true
