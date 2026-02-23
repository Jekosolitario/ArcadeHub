package it.project_work.app_arcade.utilities;

public final class Leveling {

    private Leveling() {
    }

    public static LevelInfo fromTotalXp(long xpTotal) {
        long xp = Math.max(0, xpTotal);

        int lvl = 1;
        long toNext = 1000; // 1->2

        while (xp >= toNext) {
            xp -= toNext;
            lvl++;
            
            if (toNext > Long.MAX_VALUE / 2) {
                toNext = Long.MAX_VALUE;
                break;
            }
            toNext *= 2; // raddoppia
        }

        // xp = XP dentro il livello corrente
        // toNext = XP necessari per passare al prossimo livello
        return new LevelInfo(lvl, xp, toNext);
    }
}
