TEMPLATE FOR RETROSPECTIVE (Team 13)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 
    - 3 stories committed --- 2 stories done
- Total points committed vs. done 
    - 4 points committed --- 3 points done
- Nr of hours planned vs. spent (as a team)
    - time estimated: 55h25m --- time spent: 60h56m

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
|-------|--------:|-------:|-----------:|-------------:|
| _Uncategorized_ | 11 | - | 29h45m | 29h45m |
| Get ticket | 8 | 2 | 13h05m | 17h08m |
| Next customer | 7 | 1 | 12h35m | 14h03m |
| **Total** | 26 | 3 | **55h25m** | **60h56m** |


> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 2h08m | 2h13m | 
| Actual     | 2h20m30s | 2h22m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
  
  **Total Error Ration = 0,0996**
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| $$

  **Absolute Relative Error = 0,1583**
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 4h (stories 1 & 2), 2h (story 3, not done)
  - Total hours spent: 3h 56m (stories 1 & 2), 0h (story 3, not done)
  - Nr of automated unit test cases : 212
  - Coverage (Jest report):
    - Statements: 25.92 %
    - Branches: 11.86 %
    - Functions: 16.14 %
    - Lines: 74.45 %
- E2E testing:
  - Total hours estimated: 0h
  - Total hours spent: 0h
  - Nr of test cases: 0
- Integration testing:
  - Total hours estimated: 4h (stories 1 & 2), 2h (story 3, not done) 
  - Total hours spent: 4h 30m (stories 1 & 2), 0h (story 3, not done)
  - Nr of test cases: 26
- Code review 
  - Total hours estimated: 7h (stories 1 & 2), 2h (story 3, not done) 
  - Total hours spent: 11h 40m (stories 1 & 2), 0h (story 3, not done)
  


## ASSESSMENT

- What did go wrong in the sprint?
    - The assignment of tasks for each story lacked a clear logic and was rather arbitrary. At times, two or three group members were working intensively while the others were stuck, having to wait for the previous tasks to be completed.

- What caused your errors in estimation (if any)?
    - The major estimation errors occurred in the _Code Review_ tasks, which took longer than expected mainly due to miscommunication between the back-end and front-end developers.

- What lessons did you learn (both positive and negative) in this sprint?
    - We realized that sprint meetings should not be underestimated, as they play a crucial role in keeping the team aligned and avoiding misunderstandings.

- Which improvement goals set in the previous retrospective were you able to achieve? 
    - First sprint, no previous set goals
  
- Which ones you were not able to achieve? Why?
    - First sprint, no previous set goals

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
  - Improve team coordination to ensure a more balanced distribution of work and smoother task transitions.
  - Enhance team communication by providing more precise and complete information during discussions.

- One thing you are proud of as a Team!!
  - We always maintained a positive and respectful attitude, even when facing challenges or issues with the project.