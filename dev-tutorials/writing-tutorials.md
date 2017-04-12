
Writing tutorial repos requires special formatting of the `package.json` file.


### Format of `package.json`

In the top level directory of the tutorial, a file named `package.json` must exist.  Below is a full example of that file.


```json
{
  "name": "HCCGo R Tutorial - Beginner",
  "version": "1.0",
  "description": "Examples on how to run R scripts using both single and multiple node configurations.",
  "tags": ["R", "Beginner", "Parallel"],
  "postInstall": ["module load R/3.3", "R CMD INSTALL dplyr"],
  "submits": [
    {
      "runtime": "0:10:00",
      "memory": 5000,
      "jobname": "r-normalize",
      "error": "$WORK/r-tutorial-beginner/r-normalize.err",
      "output": "$WORK/r-tutorial-beginner/r-normalize.out",
      "location": "$WORK/r-tutorial-beginner/r-normalize.slurm",
      "modules": [ "R/3.3" ],
      "commands": "#SBATCH --nodes=1\n#SBATCH --ntasks-per-node=1\n#SBATCH --reservation=rforbio\ncd $WORK/r-tutorial-beginner\nR CMD BATCH normalize.R"
    }]
}
```