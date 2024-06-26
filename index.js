const {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
} = require("./db");
const express = require("express");
const app = express();
app.use(express.json());

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.send(await fetchFavorites(req.params.id));
  } catch (ex) {
    next(ex);
  }
});
app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.status(201).send(
      await createFavorite({
        user_id: req.params.id,
        product_id: req.body.product_id,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/users/:userId/favorites/:id", async (req, res, next) => {
  try {
    await destroyFavorite({ user_id: req.params.userId, id: req.params.id });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  await createTables();
  console.log("tables created");
  const [moe, lucy, larry, ethyl, phone, laptop, tablet] = await Promise.all([
    createUser({ username: "moe", password: "moe_pw" }),
    createUser({ username: "lucy", password: "lucy_pw" }),
    createUser({ username: "larry", password: "larry_pw" }),
    createUser({ username: "ethyl", password: "ethyl_pw" }),
    createProduct({ name: "phone" }),
    createProduct({ name: "laptop" }),
    createProduct({ name: "tablet" }),
  ]);

  console.log(await fetchUsers());
  console.log(await fetchProducts());

  const favorites = await Promise.all([
    createFavorite({ user_id: moe.id, product_id: phone.id }),
    createFavorite({ user_id: moe.id, product_id: laptop.id }),
    createFavorite({ user_id: ethyl.id, product_id: tablet.id }),
    createFavorite({ user_id: ethyl.id, product_id: phone.id }),
  ]);

  console.log(await fetchFavorites(moe.id));
  await destroyFavorite({ user_id: moe.id, id: favorites[0].id });
  console.log(await fetchFavorites(moe.id));

  console.log(`curl localhost:3000/api/users/${ethyl.id}/favorites`);
  console.log(
    `curl -X POST localhost:3000/api/users/${ethyl.id}/favorites -d '{"product_id": "${laptop.id}"}' -H 'Content-Type:application/json'`
  );
  console.log(
    `curl -X DELETE localhost:3000/api/users/${ethyl.id}/favorites/${favorites[3].id}`
  );

  console.log("data seeded");

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
