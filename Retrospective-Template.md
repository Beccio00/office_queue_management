TEMPLATE FOR RETROSPECTIVE (Team ##)
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
    - time estimated: 56h 55m --- time spent: 61h 51m

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _Uncategorized_   |         |       |            |              |
| n      |         |        |            |              |  

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation |      |       | 
| Actual     |      |       |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated
  - Total hours spent
  - Nr of automated unit test cases 
  - Coverage
- E2E testing:
  - Total hours estimated
  - Total hours spent
  - Nr of test cases
- Code review 
  - Total hours estimated 
  - Total hours spent
  


## ASSESSMENT

- What did go wrong in the sprint?
    - The assignment of the tasks of each story did not have a rigid logic behind and was too random. There were mmoments in which two or three members of the group were working hard and the other were doing nothing because they had to wait for the prevoius work to be finished.

- What caused your errors in estimation (if any)?
    - The major estimation errors are in the "Code Review" tasks. This was caused by a miscommunication between the "back-end developpers" and the "front-end developpers".

- What lessons did you learn (both positive and negative) in this sprint?
    - We understood that the sprint meeting must not be underestimated.

- Which improvement goals set in the previous retrospective were you able to achieve? 
    - This is the first retrospective
  
- Which ones you were not able to achieve? Why?
    - This is the first retospective

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
  - better team coordination
  - better team communication (info must be more precise and complete)

- One thing you are proud of as a Team!!
  - We never yelled at each other even when we had some problems with the projects.